// Seeder aset FOTO & VIDEO sungguhan ke MinIO + DB.
//
// Berbeda dengan seed-photos.ts (hanya membuat key dummy), seeder ini
// menjalankan pipeline upload yang sama dengan CMS (uploadPhotoService):
// original, thumbnail, dan watermark benar-benar di-upload ke MinIO.
//
// Sumber file:
// - Bila ada file di prisma/seeds/assets/ (jpg/png/webp/mp4/mov/webm),
//   file itu yang dipakai.
// - Bila kosong, gambar dibuat dengan sharp dan video dengan ffmpeg
//   (tanpa internet).
//
// Tiap aset minimal 5 kategori & 5 keyword (divalidasi sebelum seeding).
//
// Idempoten: aset dengan judul yang sudah ada (belum dihapus) tidak di-upload
// ulang, tapi kategori & keyword-nya dilengkapi.
//
// Jalankan:
//   npm run seed:media                 # foto + video
//   npm run seed:media -- --only=foto
//   npm run seed:media -- --only=video

import sharp from "sharp";
import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "fs";
import { extname, join, basename } from "path";
import { tmpdir } from "os";
import { prisma } from "../../src/config/db.js";
import { assertSafeTarget } from "./_guard.js";
import { redisClient } from "../../src/config/redis.js";
import { uploadPhotoService } from "../../src/modules/photo/photo.service.js";

type AssetSeed = {
  title: string;
  description: string;
  photographer: string;
  location: string;
  price: number;
  type: "FOTO" | "VIDEO";
  ownerEmail: string;
  categories: string[];
  keywords: string[];
  // Warna gradien untuk file generate (atas → bawah).
  palette: [string, string];
};

const ADMIN = "admin@lakuna.foto";
const CONTRIB = "contributor1@lakuna.foto";
// SEED_OWNER_EMAIL: semua aset dimiliki akun ini (mis. admin sungguhan di produksi),
// jadi akun contributor default tak perlu dibuat. Role ADMIN → status APPROVED.
const OWNER_OVERRIDE = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
const ownerOf = (a: { ownerEmail: string }) => OWNER_OVERRIDE || a.ownerEmail;

const assets: AssetSeed[] = [
  {
    title: "Fajar di Danau Toba",
    description: "Kabut tipis menyelimuti Danau Toba saat matahari terbit",
    photographer: "Yudi Nofiandi",
    location: "Sumatera Utara",
    price: 350000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Landscape", "Travel", "Nature", "Cultural", "Marine"],
    keywords: ["sunrise", "mountain", "cloud", "golden-hour", "drone", "river"],
    palette: ["#f6b26b", "#2c3e66"],
  },
  {
    title: "Senja di Pantai Kuta",
    description: "Langit jingga dan siluet peselancar di Pantai Kuta",
    photographer: "Sari Dewi",
    location: "Bali",
    price: 275000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Travel", "Marine", "Landscape", "Nature", "Portrait"],
    keywords: ["sunset", "beach", "ocean", "golden-hour", "island", "people"],
    palette: ["#ff7b54", "#3b1f4a"],
  },
  {
    title: "Kabut Hutan Kerinci",
    description: "Hutan hujan tropis berkabut di kaki Gunung Kerinci",
    photographer: "Andi Pratama",
    location: "Jambi",
    price: 225000,
    type: "FOTO",
    ownerEmail: CONTRIB,
    categories: ["Nature", "Landscape", "Travel", "Cultural", "Marine"],
    keywords: ["forest", "rainforest", "mountain", "cloud", "volcano", "wildlife"],
    palette: ["#9fc5a8", "#1e3b2f"],
  },
  {
    title: "Candi Prambanan Biru",
    description: "Kompleks Candi Prambanan saat blue hour",
    photographer: "Budi Santoso",
    location: "Yogyakarta",
    price: 300000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Cultural", "Travel", "Urban", "Landscape", "Street"],
    keywords: ["temple", "cloud", "sunset", "festival", "traditional-house", "people"],
    palette: ["#6d8fc7", "#101c3d"],
  },
  {
    title: "Air Terjun Tumpak Sewu",
    description: "Tirai air terjun Tumpak Sewu dari sisi atas tebing",
    photographer: "Yudi Nofiandi",
    location: "Jawa Timur",
    price: 400000,
    type: "FOTO",
    ownerEmail: CONTRIB,
    categories: ["Nature", "Landscape", "Travel", "Marine", "Cultural"],
    keywords: ["waterfall", "forest", "river", "rainforest", "drone", "cloud"],
    palette: ["#b8e0d2", "#23445a"],
  },
  {
    title: "Pasar Pagi Pasar Beringharjo",
    description: "Hiruk pikuk pedagang di Pasar Beringharjo saat pagi",
    photographer: "Sari Dewi",
    location: "Yogyakarta",
    price: 175000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Street", "Cultural", "Urban", "Portrait", "Travel"],
    keywords: ["market", "people", "traditional-house", "festival", "golden-hour", "sunrise"],
    palette: ["#f2d08a", "#6b3a1f"],
  },
  {
    title: "Ombak Pantai Selatan",
    description: "Rekaman ombak besar memecah karang di pantai selatan Jawa",
    photographer: "Andi Pratama",
    location: "Gunungkidul",
    price: 600000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Marine", "Nature", "Landscape", "Travel", "Street"],
    keywords: ["ocean", "beach", "drone", "coral-reef", "island", "sunset"],
    palette: ["#4aa3c7", "#0b2a3d"],
  },
  {
    title: "Timelapse Awan Bromo",
    description: "Timelapse lautan awan bergerak di kaldera Bromo",
    photographer: "Yudi Nofiandi",
    location: "Jawa Timur",
    price: 750000,
    type: "VIDEO",
    ownerEmail: CONTRIB,
    categories: ["Landscape", "Nature", "Travel", "Cultural", "Portrait"],
    keywords: ["volcano", "cloud", "sunrise", "mountain", "golden-hour", "drone"],
    palette: ["#f7c59f", "#2a324b"],
  },
  {
    title: "Lalu Lintas Malam Jakarta",
    description: "Cahaya kendaraan di jalan protokol Jakarta pada malam hari",
    photographer: "Budi Santoso",
    location: "Jakarta",
    price: 500000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Urban", "Street", "Portrait", "Travel", "Cultural"],
    keywords: ["people", "rain", "market", "festival", "drone", "sunset"],
    palette: ["#e94f37", "#1b1b2f"],
  },
  {
    title: "Rumah Adat Wae Rebo",
    description: "Tujuh rumah kerucut Mbaru Niang berselimut kabut di dataran tinggi Flores",
    photographer: "Sari Dewi",
    location: "Nusa Tenggara Timur",
    price: 325000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Cultural", "Travel", "Landscape", "Nature", "Portrait"],
    keywords: ["traditional-house", "mountain", "cloud", "forest", "people", "sunrise"],
    palette: ["#c9d6c3", "#2f3b2a"],
  },
  {
    title: "Terumbu Karang Wakatobi",
    description: "Taman karang warna-warni dan ikan karang di perairan Wakatobi",
    photographer: "Andi Pratama",
    location: "Sulawesi Tenggara",
    price: 450000,
    type: "FOTO",
    ownerEmail: CONTRIB,
    categories: ["Marine", "Nature", "Travel", "Landscape", "Cultural"],
    keywords: ["coral-reef", "ocean", "wildlife", "island", "beach", "drone"],
    palette: ["#5ec2c6", "#0d3b4f"],
  },
  {
    title: "Festival Lampion Borobudur",
    description: "Ribuan lampion dilepas ke langit malam saat Waisak di Candi Borobudur",
    photographer: "Budi Santoso",
    location: "Magelang",
    price: 380000,
    type: "FOTO",
    ownerEmail: ADMIN,
    categories: ["Cultural", "Travel", "Portrait", "Street", "Urban"],
    keywords: ["festival", "temple", "people", "sunset", "traditional-house", "cloud"],
    palette: ["#f4b860", "#1f1a3a"],
  },
  {
    title: "Perahu Nelayan Labuan Bajo",
    description: "Perahu kayu nelayan melintas di teluk Labuan Bajo saat senja",
    photographer: "Yudi Nofiandi",
    location: "Nusa Tenggara Timur",
    price: 650000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Marine", "Travel", "Landscape", "Cultural", "Nature"],
    keywords: ["ocean", "island", "sunset", "golden-hour", "drone", "people"],
    palette: ["#f08a5d", "#233d4d"],
  },
  {
    title: "Kabut Pagi Kebun Teh Puncak",
    description: "Kabut bergerak pelan di atas hamparan kebun teh Puncak pada pagi hari",
    photographer: "Sari Dewi",
    location: "Jawa Barat",
    price: 550000,
    type: "VIDEO",
    ownerEmail: CONTRIB,
    categories: ["Landscape", "Nature", "Travel", "Cultural", "Portrait"],
    keywords: ["cloud", "mountain", "sunrise", "forest", "golden-hour", "people"],
    palette: ["#b5d99c", "#26422f"],
  },
  {
    title: "Arus Sungai Mahakam",
    description: "Aerial perahu ketinting menyusuri Sungai Mahakam yang berkelok",
    photographer: "Andi Pratama",
    location: "Kalimantan Timur",
    price: 700000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Nature", "Travel", "Landscape", "Cultural", "Marine"],
    keywords: ["river", "rainforest", "drone", "forest", "people", "cloud"],
    palette: ["#8fb996", "#1d3a2f"],
  },
  {
    title: "Tari Saman Aceh",
    description: "Gerak serempak penari Saman dalam satu barisan rapat",
    photographer: "Sari Dewi",
    location: "Aceh",
    price: 800000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Cultural", "Portrait", "Travel", "Street", "Urban"],
    keywords: ["festival", "people", "traditional-house", "market", "golden-hour", "temple"],
    palette: ["#d9a441", "#3a1c1c"],
  },
  {
    title: "Gerhana Senja Pulau Padar",
    description: "Timelapse matahari tenggelam di balik punggung bukit Pulau Padar",
    photographer: "Yudi Nofiandi",
    location: "Nusa Tenggara Timur",
    price: 850000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Landscape", "Travel", "Nature", "Marine", "Cultural"],
    keywords: ["sunset", "island", "mountain", "ocean", "golden-hour", "cloud"],
    palette: ["#f29e4c", "#2b1d3a"],
  },
  {
    title: "Kereta Malam Stasiun Tugu",
    description: "Kereta api berangkat dari Stasiun Tugu dengan jejak cahaya malam",
    photographer: "Budi Santoso",
    location: "Yogyakarta",
    price: 450000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Urban", "Street", "Travel", "Cultural", "Portrait"],
    keywords: ["people", "rain", "market", "sunset", "festival", "drone"],
    palette: ["#e8c547", "#141b2d"],
  },
  {
    title: "Penyu Menetas Pantai Pangumbahan",
    description: "Tukik berlarian menuju laut setelah menetas di Pantai Pangumbahan",
    photographer: "Andi Pratama",
    location: "Sukabumi",
    price: 900000,
    type: "VIDEO",
    ownerEmail: CONTRIB,
    categories: ["Marine", "Nature", "Travel", "Landscape", "Cultural"],
    keywords: ["wildlife", "beach", "ocean", "sunrise", "island", "golden-hour"],
    palette: ["#e4c9a0", "#1f4e5f"],
  },
  {
    title: "Kawah Ijen Api Biru",
    description: "Nyala api biru belerang di dasar Kawah Ijen sebelum fajar",
    photographer: "Yudi Nofiandi",
    location: "Banyuwangi",
    price: 950000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Landscape", "Nature", "Travel", "Cultural", "Portrait"],
    keywords: ["volcano", "mountain", "sunrise", "cloud", "people", "drone"],
    palette: ["#4f7cff", "#0a0f24"],
  },
  {
    title: "Pacu Jalur Kuantan",
    description: "Perahu panjang berisi puluhan pendayung berpacu di Sungai Kuantan",
    photographer: "Budi Santoso",
    location: "Riau",
    price: 750000,
    type: "VIDEO",
    ownerEmail: ADMIN,
    categories: ["Cultural", "Travel", "Street", "Portrait", "Nature"],
    keywords: ["festival", "river", "people", "drone", "golden-hour", "market"],
    palette: ["#f2c14e", "#1e3d2f"],
  },
];

// Tiap aset wajib punya minimal sekian kategori & keyword.
const MIN_CATEGORIES = 5;
const MIN_KEYWORDS = 5;

const ASSET_DIR = join(import.meta.dirname, "assets");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function generateImage(a: AssetSeed): Promise<Buffer> {
  const [top, bottom] = a.palette;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
  </defs>
  <rect width="2400" height="1600" fill="url(#sky)"/>
  <circle cx="1700" cy="520" r="180" fill="#ffffff" opacity="0.35"/>
  <path d="M0 1150 L500 700 L900 1050 L1400 600 L2000 1100 L2400 850 L2400 1600 L0 1600 Z" fill="#000" opacity="0.25"/>
  <path d="M0 1350 L600 1000 L1100 1300 L1700 950 L2400 1300 L2400 1600 L0 1600 Z" fill="#000" opacity="0.35"/>
  <text x="120" y="1480" font-family="Georgia, serif" font-size="96" fill="#fff" opacity="0.9">${escapeXml(a.title)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

function generateVideo(a: AssetSeed): Buffer {
  const dir = mkdtempSync(join(tmpdir(), "lakuna-seed-"));
  const out = join(dir, "clip.mp4");
  const [top, bottom] = a.palette.map((c) => c.replace("#", "0x"));
  try {
    // Klip 6 detik 1280x720: gradien bergerak + suara sinus pelan.
    execFileSync(
      "ffmpeg",
      [
        "-f", "lavfi",
        "-i", `gradients=s=1280x720:d=6:r=30:c0=${top}:c1=${bottom}:speed=0.02`,
        "-f", "lavfi",
        "-i", "sine=frequency=220:duration=6",
        "-shortest",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast",
        "-c:a", "aac", "-b:a", "64k",
        "-movflags", "+faststart",
        "-y", out,
      ],
      { stdio: "pipe" },
    );
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// File lokal di prisma/seeds/assets/ dipakai berurutan per tipe.
function loadLocalFiles() {
  if (!existsSync(ASSET_DIR)) return { FOTO: [] as string[], VIDEO: [] as string[] };
  const files = readdirSync(ASSET_DIR).sort().map((f) => join(ASSET_DIR, f));
  return {
    FOTO: files.filter((f) => IMAGE_EXT.has(extname(f).toLowerCase())),
    VIDEO: files.filter((f) => VIDEO_EXT.has(extname(f).toLowerCase())),
  };
}

// Idempoten: pasangan foto–kategori/keyword yang sudah ada dilewati.
async function linkTaxonomy(photoId: string, a: AssetSeed) {
  for (const name of new Set(a.categories)) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.photoCategory.upsert({
      where: { photoId_categoryId: { photoId, categoryId: c.id } },
      update: {},
      create: { photoId, categoryId: c.id },
    });
  }
  for (const name of new Set(a.keywords)) {
    const k = await prisma.keyword.upsert({ where: { name_lang: { name, lang: "id" } }, update: {}, create: { name, lang: "id" } });
    await prisma.photoKeyword.upsert({
      where: { photoId_keywordId: { photoId, keywordId: k.id } },
      update: {},
      create: { photoId, keywordId: k.id },
    });
  }
}

async function main() {
  assertSafeTarget();
  const only = process.argv.find((x) => x.startsWith("--only="))?.split("=")[1]?.toUpperCase();
  if (only && only !== "FOTO" && only !== "VIDEO") {
    throw new Error(`--only harus "foto" atau "video" (diterima: ${only})`);
  }
  const selected = assets.filter((a) => !only || a.type === only);
  const local = loadLocalFiles();
  const cursor = { FOTO: 0, VIDEO: 0 };

  console.log(`🌱 Seeding ${selected.length} aset (${only ?? "FOTO + VIDEO"})...\n`);

  // Pemilik aset harus sudah ada (jalankan seed-cms-users.ts dulu).
  const owners = new Map<string, { id: string; role: string }>();
  for (const email of new Set(selected.map(ownerOf))) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!u) throw new Error(`User ${email} belum ada — jalankan seed-cms-users.ts dulu`);
    owners.set(email, u);
  }

  for (const a of selected) {
    const cats = new Set(a.categories).size;
    const kws = new Set(a.keywords).size;
    if (cats < MIN_CATEGORIES || kws < MIN_KEYWORDS) {
      throw new Error(
        `"${a.title}" butuh minimal ${MIN_CATEGORIES} kategori & ${MIN_KEYWORDS} keyword (sekarang ${cats} & ${kws})`,
      );
    }
  }

  let created = 0;
  for (const [i, a] of selected.entries()) {
    const tag = `[${i + 1}/${selected.length}] ${a.type} "${a.title}"`;

    const exists = await prisma.photo.findFirst({ where: { title: a.title, deletedAt: null } });
    if (exists) {
      // Aset lama tidak di-upload ulang, tapi relasinya dilengkapi.
      await linkTaxonomy(exists.id, a);
      console.log(`  ↷ ${tag} sudah ada — kategori & keyword diselaraskan`);
      continue;
    }

    const localPath = local[a.type][cursor[a.type]++];
    let buffer: Buffer;
    let mimetype: string;
    if (localPath) {
      buffer = readFileSync(localPath);
      mimetype = MIME[extname(localPath).toLowerCase()];
    } else if (a.type === "FOTO") {
      buffer = await generateImage(a);
      mimetype = "image/jpeg";
    } else {
      buffer = generateVideo(a);
      mimetype = "video/mp4";
    }

    const owner = owners.get(ownerOf(a))!;
    const photo = await uploadPhotoService({
      file: { buffer, mimetype } as Express.Multer.File,
      title: a.title,
      description: a.description,
      location: a.location,
      photographer: a.photographer,
      price: a.price,
      type: a.type,
      userId: owner.id,
      role: owner.role,
    });

    await linkTaxonomy(photo.id, a);

    created++;
    const src = localPath ? basename(localPath) : "generated";
    console.log(`  ✓ ${tag} → ${photo.status} (${src})`);
  }

  console.log(`\n✅ Selesai — ${created} aset baru, ${selected.length - created} diselaraskan`);
}

main()
  .then(() => (process.exitCode = 0))
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    redisClient.disconnect();
  });

// Seeder 50 aset dummy (38 FOTO + 12 VIDEO) lewat pipeline upload asli.
//
// - Gambar dibuat dengan sharp (SVG gradien + siluet gunung + judul).
// - Video dibuat dengan ffmpeg (gradien bergerak 6 dtk + sinus).
// - Pemilik = ADMIN → status langsung APPROVED (tampil di publik).
// - Idempoten: judul diawali "[Dummy]" dan sudah ada → dilewati.
//
// Jalankan (dari apps/api):
//   npm run seed:dummy
import sharp from "sharp";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { prisma } from "../../src/config/db.js";
import { assertSafeTarget } from "./_guard.js";
import { redisClient } from "../../src/config/redis.js";
import { uploadPhotoService } from "../../src/modules/photo/photo.service.js";

const ADMIN = "admin@lakuna.foto";

const TITLES: Array<[string, string, string]> = [
  // [judul, lokasi, fotografer]
  ["Pagi di Kebun Teh Puncak", "Jawa Barat", "Yudi Nofiandi"],
  ["Nelayan Danau Toba", "Sumatera Utara", "Sari Dewi"],
  ["Senja Pantai Senggigi", "Nusa Tenggara Barat", "Andi Pratama"],
  ["Kabut Rinjani Pagi Hari", "Nusa Tenggara Barat", "Budi Santoso"],
  ["Pasar Terapung Martapura", "Kalimantan Selatan", "Dewi Lestari"],
  ["Orangutan Taman Tanjung", "Kalimantan Tengah", "Yudi Nofiandi"],
  ["Sunrise Bromo Tengger", "Jawa Timur", "Sari Dewi"],
  ["Karst Maros Pangkep", "Sulawesi Selatan", "Andi Pratama"],
  ["Pantai Pink Labuan Bajo", "Nusa Tenggara Timur", "Budi Santoso"],
  ["Hutan Mangrove Tarakan", "Kalimantan Utara", "Dewi Lestari"],
  ["Danau Kelimutu Tiga Warna", "Nusa Tenggara Timur", "Yudi Nofiandi"],
  ["Air Terjun Tumpak Sewu", "Jawa Timur", "Sari Dewi"],
  ["Bukit Teletubbies Bromo", "Jawa Timur", "Andi Pratama"],
  ["Pulau Padar Pagi Hari", "Nusa Tenggara Timur", "Budi Santoso"],
  ["Candi Prambanan Senja", "DI Yogyakarta", "Dewi Lestari"],
  ["Pantai Parangtritis", "DI Yogyakarta", "Yudi Nofiandi"],
  ["Kawah Ijen Blue Fire", "Jawa Timur", "Sari Dewi"],
  ["Savana Baluran", "Jawa Timur", "Andi Pratama"],
  ["Pura Ulun Danu Beratan", "Bali", "Budi Santoso"],
  ["Tegalalang Rice Terrace", "Bali", "Dewi Lestari"],
  ["Nusa Penida Cliff", "Bali", "Yudi Nofiandi"],
  ["Gili Trawangan Sunset", "Nusa Tenggara Barat", "Sari Dewi"],
  ["Raja Ampat Wayag", "Papua Barat Daya", "Andi Pratama"],
  ["Lembah Baliem Wamena", "Papua Pegunungan", "Budi Santoso"],
  ["Pantai Ora Seram", "Maluku", "Dewi Lestari"],
  ["Kepulauan Banda Neira", "Maluku", "Yudi Nofiandi"],
  ["Danau Sentani Jayapura", "Papua", "Sari Dewi"],
  ["Bukit Lawang Orangutan", "Sumatera Utara", "Andi Pratama"],
  ["Jam Gadang Bukittinggi", "Sumatera Barat", "Budi Santoso"],
  ["Ngarai Sianok", "Sumatera Barat", "Dewi Lestari"],
  ["Pantai Belitung Granit", "Kepulauan Bangka Belitung", "Yudi Nofiandi"],
  ["Taman Nasional Way Kambas", "Lampung", "Sari Dewi"],
  ["Ciletuh Geopark", "Jawa Barat", "Andi Pratama"],
  ["Kawah Putih Ciwidey", "Jawa Barat", "Budi Santoso"],
  ["Pantai Anyer Sunset", "Banten", "Dewi Lestari"],
  ["Kepulauan Seribu", "DKI Jakarta", "Yudi Nofiandi"],
  ["Monas Malam Hari", "DKI Jakarta", "Sari Dewi"],
  ["Kota Tua Jakarta", "DKI Jakarta", "Andi Pratama"],
];

const VIDEO_TITLES: Array<[string, string, string]> = [
  ["Drone Pantai Kuta", "Bali", "Yudi Nofiandi"],
  ["Flyover Jembatan Suramadu", "Jawa Timur", "Sari Dewi"],
  ["Aerial Danau Toba", "Sumatera Utara", "Andi Pratama"],
  ["Drone Raja Ampat", "Papua Barat Daya", "Budi Santoso"],
  ["Timelapse Bromo Milky Way", "Jawa Timur", "Dewi Lestari"],
  ["Drone Labuan Bajo", "Nusa Tenggara Timur", "Yudi Nofiandi"],
  ["Flyover Kota Makassar", "Sulawesi Selatan", "Sari Dewi"],
  ["Aerial Kepulauan Seribu", "DKI Jakarta", "Andi Pratama"],
  ["Drone Air Terjun Sekumpul", "Bali", "Budi Santoso"],
  ["Timelapse Pantai Parangtritis", "DI Yogyakarta", "Dewi Lestari"],
  ["Drone Taman Nasional Baluran", "Jawa Timur", "Yudi Nofiandi"],
  ["Aerial Candi Borobudur", "Jawa Tengah", "Sari Dewi"],
];

const PALETTES: Array<[string, string]> = [
  ["#f6b26b", "#2c3e66"],
  ["#ff7b54", "#3b1f4a"],
  ["#7fd4c1", "#1d3557"],
  ["#a8d5a2", "#2d4a22"],
  ["#f4d35e", "#6b4226"],
  ["#ee964b", "#442220"],
  ["#90be6d", "#1a3a4a"],
  ["#f95738", "#0d3b66"],
];

const CATEGORY_POOL = [
  "Landscape", "Travel", "Nature", "Cultural", "Marine",
  "Portrait", "Urban", "Aerial", "Food", "Wildlife",
];

const KEYWORD_POOL = [
  "sunrise", "sunset", "mountain", "beach", "ocean", "drone",
  "golden-hour", "island", "forest", "river", "culture", "people",
  "temple", "city", "wildlife", "lake", "waterfall", "aerial",
];

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function generateImage(title: string, palette: [string, string]): Promise<Buffer> {
  const [top, bottom] = palette;
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
  <text x="120" y="1480" font-family="Georgia, serif" font-size="96" fill="#fff" opacity="0.9">${escapeXml(title)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

function generateVideo(palette: [string, string]): Buffer {
  const dir = mkdtempSync(join(tmpdir(), "lakuna-dummy-"));
  const out = join(dir, "clip.mp4");
  const [top, bottom] = palette.map((c) => c.replace("#", "0x"));
  try {
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

async function linkTaxonomy(photoId: string, categories: string[], keywords: string[]) {
  for (const name of new Set(categories)) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.photoCategory.upsert({
      where: { photoId_categoryId: { photoId, categoryId: c.id } },
      update: {},
      create: { photoId, categoryId: c.id },
    });
  }
  for (const name of new Set(keywords)) {
    const k = await prisma.keyword.upsert({ where: { name_lang: { name, lang: "id" } }, update: {}, create: { name, lang: "id" } });
    await prisma.photoKeyword.upsert({
      where: { photoId_keywordId: { photoId, keywordId: k.id } },
      update: {},
      create: { photoId, keywordId: k.id },
    });
  }
}

async function main() {
  // Database selain localhost wajib --yes (cegah menulis ke produksi tanpa sengaja).
  assertSafeTarget();
  const owner = await prisma.user.findUnique({ where: { email: ADMIN }, select: { id: true, role: true } });
  if (!owner) throw new Error(`User ${ADMIN} belum ada — jalankan seed-cms-users.ts dulu`);

  type Item = { title: string; location: string; photographer: string; type: "FOTO" | "VIDEO" };
  const items: Item[] = [
    ...TITLES.map(([title, location, photographer]): Item => ({ title, location, photographer, type: "FOTO" })),
    ...VIDEO_TITLES.map(([title, location, photographer]): Item => ({ title, location, photographer, type: "VIDEO" })),
  ];
  console.log(`🌱 Seeding ${items.length} aset dummy...\n`);

  let created = 0;
  let skipped = 0;
  for (const [i, item] of items.entries()) {
    const title = `[Dummy] ${item.title}`;
    const exists = await prisma.photo.findFirst({ where: { title, deletedAt: null } });
    if (exists) {
      skipped++;
      continue;
    }
    const palette = PALETTES[i % PALETTES.length];
    const buffer = item.type === "FOTO" ? await generateImage(item.title, palette) : generateVideo(palette);
    const price = 75000 + ((i * 37) % 20) * 25000;

    const photo = await uploadPhotoService({
      file: { buffer, mimetype: item.type === "FOTO" ? "image/jpeg" : "video/mp4" } as Express.Multer.File,
      title,
      description: `Foto dummy "${item.title}" untuk pengujian tampilan — ${item.location}.`,
      location: item.location,
      photographer: item.photographer,
      price,
      type: item.type,
      userId: owner.id,
      role: owner.role,
    });

    const cats = [0, 1, 2, 3, 4].map((k) => CATEGORY_POOL[(i + k * 3) % CATEGORY_POOL.length]);
    const kws = [0, 1, 2, 3, 4, 5].map((k) => KEYWORD_POOL[(i + k * 2) % KEYWORD_POOL.length]);
    await linkTaxonomy(photo.id, cats, kws);
    created++;
    console.log(`  ✓ [${i + 1}/${items.length}] ${item.type} "${title}" → ${photo.status}`);
  }

  console.log(`\n✅ Selesai — ${created} baru, ${skipped} sudah ada (dilewati)`);
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

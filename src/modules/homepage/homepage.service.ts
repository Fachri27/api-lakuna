import crypto from "crypto";
import sharp from "sharp";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFileSync, mkdtempSync, rmSync, openSync, readSync, closeSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";
import { uploadBuffer, uploadFile } from "../../utils/uploadToMinio.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getPhotosByIdsService } from "../photo/photo.service.js";

/**
 * Mimetype + content verification for homepage section images (stored-XSS
 * hardening). Same policy as category uploads:
 * - Extension is derived from the verified/re-encoded output (always `.jpg`),
 *   never from `file.originalname` (attacker-controlled).
 * - The actual bytes are verified via `sharp(buffer).metadata()`; only
 *   jpeg/png/webp are accepted (SVG/polyglot fails to decode → rejected).
 * - The buffer is re-encoded to JPEG so the stored object is always served as
 *   `image/jpeg` and can never execute as SVG/HTML.
 */
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "jpg", "png", "webp"]);

/** Video latar hanya untuk hero (mp4/webm, diverifikasi magic bytes —
 *  ftyp untuk mp4, EBML untuk webm). Section lain tetap gambar. */
const ALLOWED_VIDEO_MIMES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Batas mentah upload video hero (sebelum kompresi) — cegah OOM/thrash. */
const HERO_VIDEO_MAX_BYTES = 500 * 1024 * 1024;
/** Di atas ini (80 MB) baru dikompresi: hero ratusan MB tidak akan pernah
 *  selesai loading sebagai latar (kasus nyata: 282 MB). Di bawahnya file
 *  ASLI dipakai apa adanya — dulu batasnya 25 MB dan semua klip diturunkan
 *  ke 1080p CRF 23, hero jadi burik di layar retina. */
const HERO_VIDEO_COMPRESS_ABOVE = 80 * 1024 * 1024;

const execFileAsync = promisify(execFile);

/** Kompresi klip hero untuk latar web fullscreen. ASINKRON (tidak membekukan
 *  server seperti execFileSync dulu) dan hemat memori: thread dibatasi — x264
 *  tanpa batas membuka thread per inti MESIN lalu 4K membengkak sampai
 *  dimatikan OOM-killer. Resolusi asli dipertahankan sampai 2560 px lebar
 *  (QHD; di atas itu diturunkan — latar fullscreen tak butuh 4K, dan 4K-lah
 *  yang meledakkan memori), CRF 20, audio dipertahankan (AAC 128k; tanpa jalur
 *  audio `-map 0:a:0?` tak menambah apa pun), faststart agar langsung streaming.
 *  Mengembalikan jalur keluaran + direktori sementara (dihapus pemanggil). */
export async function compressHeroVideo(srcPath: string): Promise<{ outPath: string; dir: string }> {
  const dir = mkdtempSync(join(tmpdir(), "hero-"));
  const outPath = join(dir, "hero.mp4");
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
        "-threads", "2", "-filter_threads", "1",
        "-i", srcPath,
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", "scale='min(iw,2560)':-2",
        "-c:v", "libx264", "-preset", "veryfast",
        "-x264-params", "threads=2:lookahead_threads=1:rc-lookahead=10:ref=2",
        "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        outPath,
      ],
      { timeout: 15 * 60 * 1000, maxBuffer: 1024 * 1024 },
    );
    return { outPath, dir };
  } catch (err) {
    rmSync(dir, { recursive: true, force: true });
    throw err;
  }
}

/** Baca `n` byte pertama berkas (tanpa memuat seluruhnya) — untuk cek magic bytes. */
function readHead(file: Express.Multer.File, n: number): Buffer {
  if (file.buffer) return file.buffer.subarray(0, n);
  const fd = openSync(file.path, "r");
  try {
    const b = Buffer.alloc(n);
    const read = readSync(fd, b, 0, n, 0);
    return b.subarray(0, read);
  } finally {
    closeSync(fd);
  }
}

/** Isi berkas sebagai Buffer — hanya untuk GAMBAR (kecil); video tak pernah lewat sini. */
function fileBuf(file: Express.Multer.File): Buffer {
  return file.buffer ?? readFileSync(file.path);
}

/** Batas gambar homepage (video punya batas sendiri, 500 MB). */
const HOMEPAGE_IMAGE_MAX_BYTES = 50 * 1024 * 1024;

function verifyVideoBuffer(buffer: Buffer, mime: "video/mp4" | "video/webm"): void {  if (mime === "video/mp4") {
    // ISO BMFF: 4 byte ukuran + "ftyp" di offset 4.
    if (buffer.length < 12 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") {
      throw new AppError(400, "INVALID_VIDEO", "File bukan video MP4 yang valid");
    }
    return;
  }
  // WebM/Matroska: EBML header 0x1A45DFA3.
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x1a || buffer[1] !== 0x45 || buffer[2] !== 0xdf || buffer[3] !== 0xa3
  ) {
    throw new AppError(400, "INVALID_VIDEO", "File bukan video WebM yang valid");
  }
}

async function sanitizeImageUpload(file: Express.Multer.File): Promise<{
  buffer: Buffer;
  mimetype: "image/jpeg";
  ext: "jpg";
}> {
  const mime = (file.mimetype || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/svg+xml" || mime === "text/html" || mime.includes("+xml")) {
    throw new AppError(400, "INVALID_FILE_TYPE", "File harus gambar JPG, PNG, atau WebP");
  }
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new AppError(400, "INVALID_FILE_TYPE", "File harus gambar JPG, PNG, atau WebP");
  }
  if (file.size > HOMEPAGE_IMAGE_MAX_BYTES) {
    throw new AppError(400, "IMAGE_TOO_LARGE", "Gambar maksimal 50 MB");
  }

  let format: string | undefined;
  try {
    const metadata = await sharp(fileBuf(file)).metadata();
    format = metadata.format?.toLowerCase();
  } catch {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }
  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }

  try {
    const buffer = await sharp(fileBuf(file)).jpeg({ quality: 90 }).toBuffer();
    return { buffer, mimetype: "image/jpeg", ext: "jpg" };
  } catch {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }
}

/** Bagian homepage yang dikelola CMS. arsip/video/harga = header + kurasi
 *  section landing (strip foto, contact sheet video, teaser langganan).
 *  banding = teks perbandingan pratinjau vs unduhan. percaya = eyebrow +
 *  logo pelanggan (kurasi foto). etalase = teks + kurasi foto showcase
 *  ekowisata di atas footer. */
export const HOMEPAGE_SECTIONS = [
  "hero",
  "manifesto",
  "anjungan_1",
  "mulai",
  "journeys",
  "orbit",
  "arsip",
  "video",
  "harga",
  "klip",
  "banding",
  "percaya",
  "etalase",
  "koridor_kiri",
  "koridor_kanan",
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTIONS)[number];

/** Section yang dikurasi sebagai daftar foto (bukan satu image + teks). */
export const PHOTO_SECTION_KEYS = ["journeys", "orbit", "klip", "percaya", "etalase", "koridor_kiri", "koridor_kanan"] as const;
type PhotoSectionKey = (typeof PHOTO_SECTION_KEYS)[number];
function isPhotoSection(key: string): key is PhotoSectionKey {
  return (PHOTO_SECTION_KEYS as readonly string[]).includes(key);
}

export type HomepageSection = {
  key: HomepageSectionKey;
  imageKey: string | null;
  imageUrl: string | null;
  /** Jenis media latar: "video" bila hero diisi klip (autoplay bisu). */
  mediaType: "image" | "video" | null;
  kicker: string | null;
  title: string | null;
  body: string | null;
  cta: string | null;
  /** id foto terpilih (hanya untuk section journeys/orbit/etalase). */
  photoIds: string[] | null;
  /** Objek foto yang sudah di-resolve (dengan thumbUrl) — hanya journeys/orbit/etalase. */
  photos: unknown[] | null;
  updatedAt: string | null;
};

type StoredSection = {
  imageKey?: string | null;
  mediaType?: "image" | "video" | null;
  kicker?: string | null;
  title?: string | null;
  body?: string | null;
  cta?: string | null;
  photoIds?: string[] | null;
};

function settingKey(section: string) {
  return `homepage_${section}`;
}

/** Tebak jenis media dari ekstensi object key (untuk data lama tanpa mediaType). */
function sniffMediaType(imageKey: string): "image" | "video" {
  return /\.(mp4|webm|mov|m4v)$/i.test(imageKey) ? "video" : "image";
}

function isValidKey(key: string): key is HomepageSectionKey {
  return (HOMEPAGE_SECTIONS as readonly string[]).includes(key);
}

/** Resolve imageKey → presigned URL, gagal diam-diam (fallback null). */
async function resolveImageUrl(imageKey: string | null | undefined): Promise<string | null> {
  if (!imageKey) return null;
  try {
    return await getPresignedUrl(imageKey);
  } catch {
    return null;
  }
}

/** Baca satu section dari tabel Setting (value = JSON string). */
async function readSection(key: HomepageSectionKey): Promise<HomepageSection> {
  const row = await prisma.setting.findUnique({ where: { key: settingKey(key) } });
  let stored: StoredSection = {};
  if (row?.value) {
    try {
      stored = JSON.parse(row.value) as StoredSection;
    } catch {
      stored = {};
    }
  }

  const photoIds = stored.photoIds ?? null;
  // Untuk section journeys/orbit/etalase, resolve id → objek foto (dengan thumbUrl).
  const photos = isPhotoSection(key) && photoIds?.length ? await getPhotosByIdsService(photoIds) : null;

  return {
    key,
    imageKey: stored.imageKey ?? null,
    imageUrl: await resolveImageUrl(stored.imageKey),
    // Fallback untuk section lama (sebelum mediaType ada): tebak dari ekstensi.
    mediaType: stored.mediaType ?? (stored.imageKey ? sniffMediaType(stored.imageKey) : null),
    kicker: stored.kicker ?? null,
    title: stored.title ?? null,
    body: stored.body ?? null,
    cta: stored.cta ?? null,
    photoIds,
    photos,
    updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export async function getHomepageService(): Promise<HomepageSection[]> {
  return Promise.all(HOMEPAGE_SECTIONS.map((k) => readSection(k)));
}

export async function getHomepageSectionService(key: string): Promise<HomepageSection> {
  if (!isValidKey(key)) {
    throw new AppError(400, "INVALID_SECTION", "Bagian homepage tidak dikenal");
  }
  return readSection(key);
}

export async function upsertHomepageSectionService(
  key: string,
  fields: { kicker: string | undefined; title: string | undefined; body: string | undefined; cta: string | undefined },
  file?: Express.Multer.File,
  photoIds?: string[] | undefined,
): Promise<HomepageSection> {
  if (!isValidKey(key)) {
    throw new AppError(400, "INVALID_SECTION", "Bagian homepage tidak dikenal");
  }

  // Ambil nilai tersimpan saat ini supaya teks/image lama tidak hilang jika
  // admin hanya mengubah sebagian field tanpa upload image baru.
  const existing = await prisma.setting.findUnique({ where: { key: settingKey(key) } });
  let stored: StoredSection = {};
  if (existing?.value) {
    try {
      stored = JSON.parse(existing.value) as StoredSection;
    } catch {
      stored = {};
    }
  }

  let imageKey = stored.imageKey ?? null;
  let mediaType: "image" | "video" | null = stored.mediaType ?? (stored.imageKey ? "image" : null);

  // Upload media baru (ganti yang lama) bila ada file.
  if (file) {
    const mime = (file.mimetype || "").split(";")[0]?.trim().toLowerCase() ?? "";
    const videoExt = ALLOWED_VIDEO_MIMES[mime];
    if (videoExt) {
      // Video hanya untuk hero — ditolak di section lain walau lolos multer.
      if (key !== "hero") {
        throw new AppError(400, "VIDEO_NOT_ALLOWED", "Video latar hanya didukung section hero");
      }
      if (file.size > HERO_VIDEO_MAX_BYTES) {
        throw new AppError(400, "VIDEO_TOO_LARGE", "Video hero maksimal 500 MB");
      }
      verifyVideoBuffer(readHead(file, 12), mime as "video/mp4" | "video/webm");
      // Kompresi otomatis bila besar: tanpa ini klip 4K ratusan MB tidak
      // pernah selesai dimuat browser sebagai latar. Diunggah dari DISK.
      let uploadPath = file.path;
      let videoMime = mime;
      let outExt = videoExt;
      let tmpDir: string | null = null;
      try {
        if (file.size > HERO_VIDEO_COMPRESS_ABOVE) {
          try {
            const c = await compressHeroVideo(file.path);
            uploadPath = c.outPath;
            tmpDir = c.dir;
            videoMime = "video/mp4";
            outExt = "mp4";
          } catch (err) {
            console.error("[homepage] kompresi video hero gagal:", (err as Error)?.message?.split("\n").slice(-3).join(" | "));
            throw new AppError(500, "VIDEO_COMPRESS_FAILED", "Video terlalu besar dan gagal dikompresi — kecilkan manual di bawah 80 MB");
          }
        }
        imageKey = `cms/homepage/${key}-${crypto.randomUUID()}.${outExt}`;
        await uploadFile(imageKey, uploadPath, videoMime);
      } finally {
        if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
      }
      mediaType = "video";
    } else {
      const clean = await sanitizeImageUpload(file);
      imageKey = `cms/homepage/${key}-${crypto.randomUUID()}.${clean.ext}`;
      await uploadBuffer(imageKey, clean.buffer, clean.mimetype);
      mediaType = "image";
    }
  }

  // photoIds hanya relevan untuk section journeys/orbit/etalase. Bila tidak dikirim
  // (undefined), pertahankan daftar lama; bila [] (array kosong), kosongkan.
  const nextPhotoIds =
    photoIds !== undefined ? Array.from(new Set(photoIds.filter(Boolean))) : stored.photoIds ?? null;

  const next: StoredSection = {
    imageKey,
    mediaType,
    kicker: fields.kicker?.trim() || null,
    title: fields.title?.trim() || null,
    body: fields.body?.trim() || null,
    cta: fields.cta?.trim() || null,
    photoIds: nextPhotoIds,
  };

  await prisma.setting.upsert({
    where: { key: settingKey(key) },
    update: { value: JSON.stringify(next) },
    create: { key: settingKey(key), value: JSON.stringify(next) },
  });

  const photos = isPhotoSection(key) && nextPhotoIds?.length ? await getPhotosByIdsService(nextPhotoIds) : null;

  return {
    key,
    imageKey: next.imageKey ?? null,
    imageUrl: await resolveImageUrl(next.imageKey),
    mediaType: next.mediaType ?? (next.imageKey ? "image" : null),
    kicker: next.kicker ?? null,
    title: next.title ?? null,
    body: next.body ?? null,
    cta: next.cta ?? null,
    photoIds: nextPhotoIds,
    photos,
    updatedAt: new Date().toISOString(),
  };
}
/**
 * Aset PUBLIK foto/video — semua yang bisa dibuka siapa pun (termasuk lewat
 * tab Network DevTools) harus resolusi rendah, berukuran kecil, dan
 * ber-watermark. File asli hanya keluar lewat /api/downloads (cek lisensi).
 *
 *   thumbnail grid   800 px, JPEG q68, TANPA watermark tile (kartu tampil bersih;
 *                    resolusinya terlalu kecil untuk dipakai ulang)
 *   pratinjau foto  1000 px, JPEG q72, watermark tile
 *   pratinjau video  640 px lebar, H.264 CRF 30, tanpa audio, watermark tile
 *
 * Seperti Shutterstock, gambar publik juga diberi PITA KREDIT putih di
 * bawahnya: "lakunastock · <ID>". Tinggi pita = CREDIT_RATIO × lebar gambar;
 * frontend memotongnya dari tampilan situs dengan object-position: top, jadi
 * pita hanya terlihat bila berkasnya dibuka langsung (mis. dari tab Network).
 *
 * Dipakai buildPhotoAssets (upload baru) dan scripts/regen-public-assets.ts
 * (menyamakan data lama).
 */
import sharp from "sharp";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { buildTiledSkewedWatermarkOverlay } from "./watermarkLogo.js";

export const THUMB_W = 800;
export const THUMB_Q = 68;
/** Thumbnail VIDEO jauh lebih besar: kartu video (contact sheet) memajangnya setinggi layar sebelum klip
 *  jalan; 800 px dibentangkan jadi buram. Kartu setinggi ±800 px CSS = 1600 px fisik di layar retina,
 *  jadi bingkai 16:9 perlu ≥2880 px lebar. ≈ 250-700 KB per video. */
export const VIDEO_THUMB_W = Math.max(THUMB_W, Number(process.env.VIDEO_THUMB_W) || 2880);
export const VIDEO_THUMB_Q = 80;
export const VIDEO_THUMB = { width: VIDEO_THUMB_W, quality: VIDEO_THUMB_Q } as const;
export const PREVIEW_W = 1000;
export const PREVIEW_Q = 72;
export const VIDEO_W = 640;
export const VIDEO_CRF = 30;

const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";

/**
 * Opsi hemat memori untuk libx264. Tanpa -threads, x264 membuka satu thread per
 * inti MESIN (di Railway: puluhan), padahal kontainer dibatasi memorinya —
 * 1080p lalu membengkak sampai ffmpeg dimatikan OOM-killer (proses mati tanpa
 * pesan error, log berhenti di "frame=0"). -loglevel error memangkas banjir
 * banner/progress di log.
 */
const FFMPEG_LIGHT = "-hide_banner -loglevel error -nostats -threads 2 -filter_threads 1";
const X264_LIGHT = "-x264-params threads=2:lookahead_threads=1:rc-lookahead=10:ref=2";

/** Ekor stderr ffmpeg saja (bukan seluruh banner) untuk log. */
function ffmpegTail(err: any): string {
  const raw = err?.stderr?.toString() || err?.message || "";
  const t = String(raw).trim().split("\n").slice(-6).join("\n");
  const sig = err?.signal ? ` [signal ${err.signal}]` : "";
  return (t || "(tanpa pesan — kemungkinan dimatikan OOM)") + sig;
}

/** Tinggi pita kredit relatif terhadap lebar gambar (800 px → 40 px). */
export const CREDIT_RATIO = 0.05;
export const CREDIT_BRAND = "lakunastock";

/** Kode ID pendek di pita: 8 karakter pertama UUID, huruf besar. */
export function creditCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

const escXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Tempel pita putih di bawah gambar berisi "lakunastock · ID". */
async function addCreditBar(img: Buffer, id: string | undefined, quality: number): Promise<Buffer> {
  if (!id) return img;
  const meta = await sharp(img).metadata();
  const w = meta.width ?? 480;
  const h = meta.height ?? 320;
  const barH = Math.max(18, Math.round(w * CREDIT_RATIO));
  const fontSize = Math.round(barH * 0.52);
  const label = `${CREDIT_BRAND} · ${creditCode(id)}`;
  const bar = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${barH}">` +
      `<rect width="100%" height="100%" fill="#ffffff"/>` +
      `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ` +
      `font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="${fontSize}" fill="#3a3d42">${escXml(label)}</text>` +
      `</svg>`,
  );
  return sharp({ create: { width: w, height: h + barH, channels: 3, background: "#ffffff" } })
    .composite([
      { input: img, top: 0, left: 0 },
      { input: bar, top: h, left: 0 },
    ])
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

/** Perkecil, tempel watermark tile, lalu pita kredit. Gagal watermark → tetap diperkecil. */
async function shrinkAndWatermark(input: Buffer | string, width: number, quality: number, id?: string): Promise<Buffer> {
  const base = await sharp(input)
    .rotate() // hormati orientasi EXIF
    .resize({ width, withoutEnlargement: true })
    .toBuffer();
  const meta = await sharp(base).metadata();
  try {
    const overlay = await buildTiledSkewedWatermarkOverlay(meta.width ?? width, meta.height ?? width);
    const marked = await sharp(base)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    return await addCreditBar(marked, id, quality);
  } catch (err) {
    console.error("[publicAssets] watermark gagal, pakai versi kecil tanpa watermark:", err);
    return sharp(base).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
}

/** Thumbnail kartu: diperkecil + pita kredit, tanpa watermark tile. */
export async function makeThumb(image: Buffer | string, id?: string, opts?: { width?: number; quality?: number }): Promise<Buffer> {
  const width = opts?.width ?? THUMB_W;
  const quality = opts?.quality ?? THUMB_Q;
  const base = await sharp(image)
    .rotate() // hormati orientasi EXIF
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  return addCreditBar(base, id, quality);
}

export function makePreviewImage(image: Buffer | string, id?: string): Promise<Buffer> {
  return shrinkAndWatermark(image, PREVIEW_W, PREVIEW_Q, id);
}

/**
 * Pratinjau video: 640 px, CRF 30, tanpa audio, watermark tile ditumpuk
 * lewat ffmpeg overlay. Overlay dibuat 640×1280 supaya video potret pun
 * tertutup; bagian yang melampaui bingkai dipotong otomatis oleh ffmpeg.
 * Mengembalikan false bila ffmpeg gagal (pemanggil memakai cadangan).
 */
export async function makePreviewVideo(inputPath: string, outPath: string): Promise<boolean> {
  const dir = mkdtempSync(join(tmpdir(), "lakuna-wm-"));
  const wmPath = join(dir, "wm.png");
  try {
    writeFileSync(wmPath, await buildTiledSkewedWatermarkOverlay(VIDEO_W, VIDEO_W * 2));
    execSync(
      `"${FFMPEG}" ${FFMPEG_LIGHT} -i "${inputPath}" -i "${wmPath}" ` +
        `-filter_complex "[0:v]scale=${VIDEO_W}:-2[v];[v][1:v]overlay=0:0" ` +
        `-c:v libx264 -preset veryfast ${X264_LIGHT} -crf ${VIDEO_CRF} -pix_fmt yuv420p -an -movflags +faststart "${outPath}" -y`,
      { stdio: "pipe", timeout: 240_000 },
    );
    return true;
  } catch (err: any) {
    console.error("[publicAssets] ffmpeg pratinjau video gagal:", ffmpegTail(err));
    return false;
  } finally {
    try { unlinkSync(wmPath); } catch {}
  }
}

/** Durasi klip kartu (hover di contact sheet / grid video). */
export const CLIP_SECONDS = 8;

/**
 * Kunci klip kartu diturunkan dari kunci pratinjau: watermark/<n>.mp4 →
 * clip/<n>.mp4. Tanpa kolom database baru; klip yang belum dibuat cukup
 * gagal di-stat dan kartu memakai pratinjau ber-watermark.
 */
export function clipKeyFor(watermarkKey: string | null | undefined): string | null {
  if (!watermarkKey || !watermarkKey.startsWith("watermark/")) return null;
  return `clip/${watermarkKey.slice("watermark/".length).replace(/\.[^.]+$/, "")}.mp4`;
}

/**
 * Sisi terpanjang klip kartu (px). 0 (bawaan) = RESOLUSI ASLI, tanpa diperkecil — kartu tampil
 * setajam berkasnya. Server yang tak kuat mengenkode 4K bisa memasang env CLIP_MAX_EDGE=1920.
 */
export const CLIP_MAX_EDGE = Math.max(0, Number(process.env.CLIP_MAX_EDGE) || 0);
/**
 * Batas bitrate klip (bawaan 12 Mbps). Pada resolusi asli, CRF murni bisa menghasilkan 25-40 Mbps
 * untuk 4K — klip 8 dtk jadi 25-40 MB dan pratinjau baru mulai berputar lama setelah di-hover.
 * Dengan batas ini klip ≤ ±12 MB: tetap resolusi asli dan tajam, tapi mulai putar cepat.
 */
export const CLIP_MAXRATE = process.env.CLIP_MAXRATE || "12M";

/**
 * Klip kartu: 8 detik pertama pada RESOLUSI ASLI (kecuali CLIP_MAX_EDGE diset), CRF 24, tanpa
 * audio, TANPA watermark. Pendek, jadi tetap ringan dimuat saat hover.
 *
 * Gagal (mis. ffmpeg kehabisan waktu/memori di server kecil saat mengenkode 4K) = berkas
 * keluaran DIHAPUS, jangan pernah mengunggah klip setengah jadi: dulu berkas terpotong
 * (tanpa "moov atom") ikut terunggah dan kartu tak bisa memutar pratinjau.
 * `input` boleh path lokal atau URL (ffmpeg hanya membaca awal berkas).
 */
export function makeClipVideo(input: string, outPath: string): boolean {
  const vf = CLIP_MAX_EDGE
    ? `-vf "scale='if(gt(iw,ih),min(${CLIP_MAX_EDGE},iw),-2)':'if(gt(iw,ih),-2,min(${CLIP_MAX_EDGE},ih))'" `
    : "";
  try {
    execSync(
      `"${FFMPEG}" ${FFMPEG_LIGHT} -t ${CLIP_SECONDS} -i "${input}" ${vf}` +
        `-c:v libx264 -preset veryfast ${X264_LIGHT} -crf 24 -maxrate ${CLIP_MAXRATE} -bufsize ${CLIP_MAXRATE.replace(/\d+/, (n) => String(Number(n) * 2))} ` +
        `-pix_fmt yuv420p -an -movflags +faststart "${outPath}" -y`,
      { stdio: "pipe", timeout: 240_000 },
    );
    return true;
  } catch (err: any) {
    console.error("[publicAssets] ffmpeg klip kartu gagal:", ffmpegTail(err));
    try {
      unlinkSync(outPath);
    } catch {
      /* belum sempat dibuat */
    }
    return false;
  }
}

/** Frame video (detik ke-1) → JPEG mentah untuk dijadikan thumbnail. */
export function grabVideoFrame(inputPath: string, outPath: string): boolean {
  try {
    execSync(`"${FFMPEG}" -i "${inputPath}" -ss 00:00:01 -vframes 1 -q:v 3 "${outPath}" -y`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

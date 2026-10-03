import sharp from "sharp";
import { execSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { minioClient } from "../config/minio.js";

const BUCKET = process.env.MINIO_BUCKET!;
const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";

async function getBuffer(key: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const stream = await minioClient.getObject(BUCKET, key);
  for await (const c of stream as unknown as AsyncIterable<Buffer>) chunks.push(c);
  return Buffer.concat(chunks);
}

/**
 * Foto untuk sertifikat lisensi: dari berkas ASLI (pemegang lisensi berhak
 * atas versi bersih), dipotong ke rasio kotak foto template, lebar 1400 px,
 * JPEG q82 — tajam dicetak tanpa membengkakkan PDF. Video: satu frame di
 * detik ke-1, dibaca ffmpeg langsung dari URL (tanpa unduh utuh).
 */
export async function loadLicensePhoto(originalKey: string, isVideo: boolean, aspect: number): Promise<Buffer> {
  let src: Buffer;
  if (isVideo) {
    const dir = mkdtempSync(join(tmpdir(), "lic-"));
    try {
      const url = await minioClient.presignedGetObject(BUCKET, originalKey, 600);
      const out = join(dir, "frame.jpg");
      execSync(`"${FFMPEG}" -ss 00:00:01 -i "${url}" -frames:v 1 -q:v 2 "${out}" -y`, { stdio: "pipe" });
      src = readFileSync(out);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  } else {
    src = await getBuffer(originalKey);
  }
  const W = 1400;
  return sharp(src)
    .rotate()
    .resize({ width: W, height: Math.round(W / aspect), fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

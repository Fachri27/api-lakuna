import crypto from "crypto";
import sharp from "sharp";
import { prisma } from "../../config/db.js";
import { getPresignedUrl, minioClient } from "../../config/minio.js";
import { uploadBuffer } from "../../utils/uploadToMinio.js";
import { uploadFileBuffer, cleanUploadFile } from "../../middlewares/upload.js";
import { AppError } from "../../middlewares/errorHandler.js";

/**
 * Logo dinding "Dipercaya tim di": daftar {id, name, imageKey} di tabel
 * Setting (key homepage_logos, JSON) — tanpa migrasi. PNG transparan
 * dipertahankan (tidak dikonversi ke JPEG).
 */
const SETTING_KEY = "homepage_logos";
const BUCKET = process.env.MINIO_BUCKET ?? "";

export type LogoItem = { id: string; name: string; imageKey: string };
export type LogoPublic = { id: string; name: string; imageUrl: string | null };

async function readLogos(): Promise<LogoItem[]> {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value) as LogoItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && typeof l.id === "string" && typeof l.imageKey === "string");
  } catch {
    return [];
  }
}

async function writeLogos(items: LogoItem[]): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(items) },
    create: { key: SETTING_KEY, value: JSON.stringify(items) },
  });
}

export async function listLogosService(): Promise<LogoPublic[]> {
  const items = await readLogos();
  return Promise.all(
    items.map(async (l) => {
      let imageUrl: string | null = null;
      try {
        imageUrl = await getPresignedUrl(l.imageKey);
      } catch {
        /* fallback null — frontend memakai dummy */
      }
      return { id: l.id, name: l.name || "Logo", imageUrl };
    }),
  );
}

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_FORMATS = new Set(["jpeg", "jpg", "png", "webp"]);

export async function createLogoService(
  name: string,
  file: Express.Multer.File,
): Promise<LogoPublic> {
  const mime = (file.mimetype || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_MIMES.has(mime)) {
    throw new AppError(400, "INVALID_FILE_TYPE", "Logo harus JPG, PNG, atau WebP");
  }
  const buffer = uploadFileBuffer(file);
  let format: string | undefined;
  try {
    format = (await sharp(buffer).metadata()).format?.toLowerCase();
  } catch {
    throw new AppError(400, "INVALID_IMAGE", "File tidak dapat diproses sebagai gambar");
  }
  if (!format || !ALLOWED_FORMATS.has(format)) {
    throw new AppError(400, "INVALID_IMAGE", "Logo harus JPG, PNG, atau WebP");
  }
  const ext = format === "jpeg" ? "jpg" : format;
  const imageKey = `logo/${crypto.randomUUID()}.${ext}`;
  await uploadBuffer(imageKey, buffer, `image/${ext === "jpg" ? "jpeg" : ext}`);
  cleanUploadFile(file);

  const items = await readLogos();
  const item: LogoItem = { id: crypto.randomUUID(), name: name.trim(), imageKey };
  items.push(item);
  await writeLogos(items);
  let imageUrl: string | null = null;
  try {
    imageUrl = await getPresignedUrl(imageKey);
  } catch {
    /* abaikan */
  }
  return { id: item.id, name: item.name, imageUrl };
}

export async function renameLogoService(id: string, name: string): Promise<LogoPublic | null> {
  const items = await readLogos();
  const item = items.find((l) => l.id === id);
  if (!item) return null;
  item.name = name.trim();
  await writeLogos(items);
  let imageUrl: string | null = null;
  try {
    imageUrl = await getPresignedUrl(item.imageKey);
  } catch {
    /* abaikan */
  }
  return { id: item.id, name: item.name, imageUrl };
}

export async function deleteLogoService(id: string): Promise<boolean> {
  const items = await readLogos();
  const item = items.find((l) => l.id === id);
  if (!item) return false;
  await writeLogos(items.filter((l) => l.id !== id));
  try {
    if (BUCKET) await minioClient.removeObject(BUCKET, item.imageKey);
  } catch {
    /* best-effort */
  }
  return true;
}

export async function orderLogosService(ids: string[]): Promise<LogoPublic[]> {
  const items = await readLogos();
  const byId = new Map(items.map((l) => [l.id, l]));
  const ordered = ids.map((id) => byId.get(id)).filter((l): l is LogoItem => !!l);
  // ID tak dikenal diabaikan; yang tersisa (tak disebut) menempel di belakang.
  for (const l of items) if (!ordered.includes(l)) ordered.push(l);
  await writeLogos(ordered);
  return listLogosService();
}

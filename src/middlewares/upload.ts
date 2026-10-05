import multer from "multer";
import { tmpdir } from "os";
import crypto from "crypto";
import { readFileSync, unlinkSync } from "fs";
import { AppError } from "./errorHandler.js";
import { UPLOAD_MAX_MB } from "../config/upload.js";

/**
 * Multer config for image and video uploads
 * - Max file size from UPLOAD_MAX_MB (default 2048 MB / 2 GB, for videos)
 * - Explicit per-field MIME whitelist (raster images only — never SVG/HTML/XML;
 *   videos only where the route actually accepts video)
 * - Memory storage for processing with Sharp (images) or direct upload (videos)
 *
 * NOTE: `file.mimetype` is client-controlled, so this filter is only the first
 * layer. Services must still verify the actual content (e.g. via
 * `sharp(buffer).metadata()`) before storing.
 */

/** Raster images only. SVG (`image/svg+xml`) is intentionally absent. */
const IMAGE_MIMETYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Explicit video allow-list for fields that accept video (photo uploads). */
const VIDEO_MIMETYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/ogg",
  "video/3gpp",
  "video/3gpp2",
  "video/mp2t",
] as const;

type MimeList = readonly string[];

/**
 * Per-field whitelist. `image` (category/homepage), `avatar` (users) and
 * `watermark` accept raster images only; `photo` (photo uploads) additionally
 * accepts video. Unknown fields fall back to the union (still never SVG/HTML).
 */
const FIELD_MIMETYPES: Record<string, MimeList> = {
  image: IMAGE_MIMETYPES,
  avatar: IMAGE_MIMETYPES,
  watermark: IMAGE_MIMETYPES,
  photo: [...IMAGE_MIMETYPES, ...VIDEO_MIMETYPES],
};

/** Normalize a client-supplied mimetype (`"Image/JPEG; charset=..."` → `"image/jpeg"`). */
function normalizeMime(mimetype: unknown): string {
  if (typeof mimetype !== "string") return "";
  return mimetype.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Active-content / XML-based types must never be stored as images or videos:
 * SVG can carry `<script>` (stored-XSS when served), `text/html` is directly
 * renderable, and any `+xml` suffix denotes an XML document with the same risk.
 */
function isDangerousMime(mime: string): boolean {
  return mime === "image/svg+xml" || mime === "text/html" || mime.includes("+xml");
}
export const upload = multer({
  // Ke DISK, bukan RAM: video ratusan MB–2 GB tak boleh ditampung di memori
  // (kontainer Railway dibatasi memori; Node dimatikan OOM-killer dan unggahan
  // putus — "Failed to fetch"/502 di CMS). Pola yang sama dengan homepageUpload.
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, _file, cb) => cb(null, `lakuna-up-${crypto.randomUUID()}`),
  }),
  limits: {
    fileSize: UPLOAD_MAX_MB * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const mime = normalizeMime(file.mimetype);

    // Explicitly reject SVG / HTML / any XML-based type (stored-XSS vector),
    // regardless of field — even if a future field allowed a broad prefix.
    if (isDangerousMime(mime)) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "File harus gambar atau video"));
      return;
    }

    const allowed: MimeList = FIELD_MIMETYPES[file.fieldname] ?? [
      ...IMAGE_MIMETYPES,
      ...VIDEO_MIMETYPES,
    ];
    if (allowed.includes(mime)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "INVALID_FILE_TYPE", "File harus gambar atau video"));
    }
  },
});

/**
 * Baca isi berkas unggahan apa pun penyimpanannya (disk pasca-migrasi OOM
 * maupun memory bila ada). Dipakai consumer kecil (kategori, avatar).
 */
export function uploadFileBuffer(file: Express.Multer.File): Buffer {
  if (file.buffer && file.buffer.length > 0) return file.buffer;
  if (file.path) return readFileSync(file.path);
  throw new AppError(400, "INVALID_FILE", "Berkas unggahan tidak terbaca");
}

/** Hapus berkas sementara di disk (bila ada); best-effort, tak pernah throw. */
export function cleanUploadFile(file: Express.Multer.File | undefined): void {
  try {
    if (file?.path) unlinkSync(file.path);
  } catch {
    /* abaikan */
  }
}

/**
 * Khusus upload media homepage (field "image"): gambar + video (mp4/webm).
 * Service membatasi video hanya untuk section hero; section lain menolaknya.
 */
/** Batas upload media homepage = batas video hero (500 MB). */
export const HOMEPAGE_UPLOAD_MAX_BYTES = 500 * 1024 * 1024;

export const homepageUpload = multer({
  // Ke DISK, bukan RAM: video hero hingga 500 MB tak boleh ditampung di memori
  // (kontainer Railway dibatasi memori; proses dimatikan OOM-killer dan koneksi
  // unggahan putus — "Failed to fetch" di CMS). Berkas sementara dihapus
  // controller setelah selesai.
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, _file, cb) => cb(null, `lakuna-up-${crypto.randomUUID()}`),
  }),
  limits: {
    fileSize: HOMEPAGE_UPLOAD_MAX_BYTES,
  },

  fileFilter: (req, file, cb) => {
    const mime = normalizeMime(file.mimetype);

    if (isDangerousMime(mime)) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "File harus gambar atau video"));
      return;
    }

    const allowed: readonly string[] = [...IMAGE_MIMETYPES, "video/mp4", "video/webm"];
    if (file.fieldname === "image" && allowed.includes(mime)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "INVALID_FILE_TYPE", "File harus gambar JPG/PNG/WebP atau video MP4/WebM"));
    }
  },
});

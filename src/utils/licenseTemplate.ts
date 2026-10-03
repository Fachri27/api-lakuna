import { PDFDocument, PDFTextField } from "pdf-lib";
import { prisma } from "../config/db.js";
import { minioClient } from "../config/minio.js";
import { uploadBuffer } from "./uploadToMinio.js";
import { DEFAULT_OVERLAY_LAYOUT, parseOverlayLayout, type OverlayLayout, type OverlayData } from "./licenseOverlay.js";

const envBucket = process.env.MINIO_BUCKET;
if (!envBucket) throw new Error("MINIO_BUCKET is required");
const BUCKET: string = envBucket;

/**
 * Template lisensi custom dari CMS: PDF jadi yang di-upload admin, berisi
 * field form (AcroForm) yang diisi otomatis saat lisensi diunduh.
 *
 * Cara membuat template (di editor PDF apa pun, mis. LibreOffice/Acrobat):
 * tambah field teks dengan NAMA PERSIS seperti di bawah. Posisi, font,
 * ukuran, dan warna mengikuti desain kamu — backend hanya mengisi nilainya
 * lalu me-flatten (field dikunci jadi teks permanen).
 */
export const LICENSE_TEMPLATE_FIELDS = [
  "licenseId", // ID lisensi (UUID)
  "photoTitle", // judul foto
  "photographer", // nama fotografer
  "licenseType", // "Standar" / "Subscription"
  "issuedTo", // nama pemegang lisensi
  "issuedDate", // tanggal terbit (format id-ID)
  "expiryText", // "Tidak Terbatas" / "Sampai …"
  "orderId", // referensi order (bisa kosong)
] as const;

export type LicenseTemplateField = (typeof LICENSE_TEMPLATE_FIELDS)[number];

export const LICENSE_TEMPLATE_OBJECT = "license/template.pdf";
export const SETTING_TEMPLATE_KEY = "license_template_key";
export const SETTING_TEMPLATE_VERSION = "license_template_version";
export const SETTING_TEMPLATE_MODE = "license_template_mode";
export const SETTING_TEMPLATE_LAYOUT = "license_template_layout";
/**
 * Maks 25 MB per berkas. Ekspor Canva berisi gambar resolusi tinggi —
 * satu halaman desain Lakunastock saja ±6,7 MB (batas lama 5 MB).
 */
export const TEMPLATE_MAX_BYTES = 25 * 1024 * 1024;
/** Maks jumlah berkas per unggahan (Hal 1, Hal 2, …) — digabung berurutan. */
export const TEMPLATE_MAX_FILES = 6;

/**
 * "form"    : PDF punya field AcroForm bernama seperti LICENSE_TEMPLATE_FIELDS.
 * "overlay" : desain jadi tanpa field (mis. Canva) — data ditulis di posisi
 *             tetap sesuai tata letak (lihat licenseOverlay.ts).
 */
export type TemplateMode = "form" | "overlay";

export type FilledLicenseData = Record<LicenseTemplateField, string>;

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Baca konfigurasi template dari settings. null = belum ada (pakai desain bawaan). */
export async function getLicenseTemplate(): Promise<{
  objectKey: string;
  version: number;
  mode: TemplateMode;
  layout: OverlayLayout;
  customLayout: boolean;
} | null> {
  const [keyRow, verRow, modeRow, layoutRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: SETTING_TEMPLATE_KEY } }),
    prisma.setting.findUnique({ where: { key: SETTING_TEMPLATE_VERSION } }),
    prisma.setting.findUnique({ where: { key: SETTING_TEMPLATE_MODE } }),
    prisma.setting.findUnique({ where: { key: SETTING_TEMPLATE_LAYOUT } }),
  ]);
  if (!keyRow?.value) return null;
  let layout = DEFAULT_OVERLAY_LAYOUT;
  let customLayout = false;
  if (layoutRow?.value) {
    try {
      layout = parseOverlayLayout(layoutRow.value);
      customLayout = true;
    } catch {
      /* tata letak tersimpan rusak — pakai bawaan */
    }
  }
  return {
    objectKey: keyRow.value,
    version: Number(verRow?.value ?? 1) || 1,
    mode: modeRow?.value === "overlay" ? "overlay" : "form",
    layout,
    customLayout,
  };
}

/** Gabungkan beberapa PDF (Hal 1, Hal 2, …) jadi satu, sesuai urutan. */
export async function mergeTemplatePdfs(files: Buffer[]): Promise<Buffer> {
  if (files.length === 1) return files[0]!;
  const out = await PDFDocument.create();
  for (const [i, bytes] of files.entries()) {
    if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error(`Berkas ke-${i + 1} bukan PDF yang valid`);
    }
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      throw new Error(`Berkas ke-${i + 1} tidak bisa dibaca (rusak / terenkripsi)`);
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return Buffer.from(await out.save({ useObjectStreams: true }));
}

/** Lebar A4 dalam point PDF. */
const A4_WIDTH = 595.28;

/**
 * Ekspor Canva kadang memakai satuan halaman yang sangat kecil (desain
 * Lakunastock: 93 × 131,55 pt ≈ 3,3 × 4,6 cm) — di pembaca PDF tampil
 * mungil dan tercetak sebesar perangko. Halaman yang lebih sempit dari
 * 300 pt diskalakan (isi + ukuran) ke lebar A4. Tata letak overlay memakai
 * `refWidth`, jadi posisinya ikut menyesuaikan otomatis.
 */
export async function normalizeTemplatePages(bytes: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  let changed = false;
  for (const page of doc.getPages()) {
    const w = page.getWidth();
    if (w > 0 && w < 300) {
      const k = A4_WIDTH / w;
      page.scale(k, k);
      changed = true;
    }
  }
  return changed ? Buffer.from(await doc.save({ useObjectStreams: true })) : bytes;
}

/** Simpan tata letak overlay dari CMS (null = kembali ke bawaan). */
export async function saveOverlayLayout(raw: unknown | null): Promise<OverlayLayout> {
  if (raw === null) {
    await prisma.setting.deleteMany({ where: { key: SETTING_TEMPLATE_LAYOUT } });
    await invalidateIssuedLicensePdfs();
    return DEFAULT_OVERLAY_LAYOUT;
  }
  const layout = parseOverlayLayout(raw);
  const value = JSON.stringify(layout);
  await prisma.setting.upsert({
    where: { key: SETTING_TEMPLATE_LAYOUT },
    create: { key: SETTING_TEMPLATE_LAYOUT, value },
    update: { value },
  });
  await invalidateIssuedLicensePdfs();
  return layout;
}

/** Validasi byte PDF + daftar nama field form di dalamnya. Throw bila bukan PDF valid. */
export async function inspectTemplatePdf(bytes: Buffer): Promise<{
  fieldNames: string[];
  knownFields: LicenseTemplateField[];
  missingFields: LicenseTemplateField[];
}> {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Berkas bukan PDF yang valid");
  }
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new Error("PDF tidak bisa dibaca (rusak / terenkripsi)");
  }
  const fieldNames = doc.getForm().getFields().map((f) => f.getName());
  const known = LICENSE_TEMPLATE_FIELDS.filter((n) => fieldNames.includes(n));
  const missing = LICENSE_TEMPLATE_FIELDS.filter((n) => !fieldNames.includes(n));
  return { fieldNames, knownFields: known, missingFields: missing };
}

/** Unduh byte template dari MinIO. */
export async function fetchTemplateBytes(objectKey: string): Promise<Buffer> {
  const stream = await minioClient.getObject(BUCKET, objectKey);
  return streamToBuffer(stream);
}

/**
 * Isi field template + flatten → Buffer PDF final.
 * Berapa pun jumlah halamannya: field boleh ada di halaman mana pun, dan
 * nama yang sama boleh dipakai ulang di beberapa halaman (mis. ID lisensi
 * di hal. 1 dan 2) — setiap kemunculan diisi nilai yang sama. Field
 * non-teks (checkbox/dropdown) atau nama tak dikenal dilewati.
 */
export async function fillLicenseTemplate(
  templateBytes: Buffer,
  data: FilledLicenseData,
): Promise<Buffer> {
  const doc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const wanted = new Set<string>(LICENSE_TEMPLATE_FIELDS);
  for (const field of form.getFields()) {
    if (!(field instanceof PDFTextField)) continue;
    const name = field.getName();
    if (!wanted.has(name)) continue;
    field.setText(data[name as LicenseTemplateField] ?? "");
  }
  form.flatten();
  const out = await doc.save();
  return Buffer.from(out);
}

/** Data contoh overlay untuk preview di CMS. */
export function sampleOverlayData(): OverlayData {
  return {
    licenseId: "00000000-0000-4000-a000-000000000000",
    licenseType: "Premium",
    photoTitle: "Kabut Pagi Kebun Teh Puncak",
    photographer: "Lakuna Nusantara Media",
    issuedDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
    expiryText: "Unlimited",
    issuedTo: "Nama Pembeli Contoh",
    username: "Nama Pembeli Contoh",
    userId: "f64a15d5-d5c8-4252-ae0d-a645bac370c5",
    itemUrl: "lakunastock.com/photos/00000000",
    orderId: "ORDER-00000000",
  };
}

/** Data contoh untuk preview di CMS. */
export function sampleLicenseData(): FilledLicenseData {
  return {
    licenseId: "00000000-0000-4000-a000-000000000000",
    photoTitle: "Kabut Pagi Kebun Teh Puncak",
    photographer: "Lakuna Studio",
    licenseType: "Standar",
    issuedTo: "Nama Pembeli Contoh",
    issuedDate: "27 September 2026",
    expiryText: "Tidak Terbatas",
    orderId: "ORDER-00000000-0000-4000-a000-000000000000",
  };
}

/** Hapus semua PDF lisensi terbitan lama agar dibuat ulang dari template baru. */
export async function invalidateIssuedLicensePdfs(): Promise<void> {
  // DB adalah sumber kebenaran regen (licenseKey null = generate ulang saat
  // diunduh). Penghapusan objek MinIO best-effort.
  await prisma.license.updateMany({
    data: { licenseKey: null },
  });
  try {
    const names: string[] = [];
    const stream = minioClient.listObjectsV2(BUCKET, "license/license-", true);
    for await (const obj of stream) {
      if (obj.name) names.push(obj.name);
    }
    for (const name of names) {
      try {
        await minioClient.removeObject(BUCKET, name);
      } catch {
        /* lanjut — objek hilang pun tak masalah */
      }
    }
  } catch {
    /* MinIO tak terjangkau — DB null sudah cukup memicu regen */
  }
}

/** Simpan template baru + naikkan versi + invalidasi terbitan lama. */
export async function saveLicenseTemplate(input: Buffer): Promise<{
  version: number;
  mode: TemplateMode;
  pageCount: number;
  fieldNames: string[];
  knownFields: LicenseTemplateField[];
  missingFields: LicenseTemplateField[];
}> {
  const inspected = await inspectTemplatePdf(input);
  const bytes = await normalizeTemplatePages(input);
  // Tanpa field yang dikenal = desain jadi (Canva dll.) → mode overlay.
  const mode: TemplateMode = inspected.knownFields.length > 0 ? "form" : "overlay";
  const pageCount = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
  await uploadBuffer(LICENSE_TEMPLATE_OBJECT, bytes, "application/pdf");
  await prisma.setting.upsert({
    where: { key: SETTING_TEMPLATE_MODE },
    create: { key: SETTING_TEMPLATE_MODE, value: mode },
    update: { value: mode },
  });
  const current = await getLicenseTemplate();
  const version = (current?.version ?? 0) + 1;
  await prisma.setting.upsert({
    where: { key: SETTING_TEMPLATE_KEY },
    create: { key: SETTING_TEMPLATE_KEY, value: LICENSE_TEMPLATE_OBJECT },
    update: { value: LICENSE_TEMPLATE_OBJECT },
  });
  await prisma.setting.upsert({
    where: { key: SETTING_TEMPLATE_VERSION },
    create: { key: SETTING_TEMPLATE_VERSION, value: String(version) },
    update: { value: String(version) },
  });
  await invalidateIssuedLicensePdfs();
  return { version, mode, pageCount, ...inspected };
}

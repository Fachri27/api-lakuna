/**
 * Template lisensi mode "overlay" — untuk desain jadi (mis. ekspor Canva)
 * yang TIDAK punya form field. Data lisensi ditulis langsung di atas desain:
 * tiap slot menutup nilai contoh bawaan desain dengan kotak sewarna sel, lalu
 * menulis nilai asli di posisi yang sama. Foto contoh diganti foto yang
 * dilisensikan.
 *
 * Koordinat dalam satuan halaman PDF (titik asal kiri-bawah) untuk halaman
 * selebar `refWidth`; halaman yang ukurannya lain diskalakan otomatis.
 * Tata letak bawaan di bawah diukur dari "Lakunastock License Hal 1.pdf"
 * (93 × 131,55). Admin bisa mengubahnya dari CMS (disimpan di Setting).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type OverlayFont = "regular" | "semibold" | "bold";

export type OverlaySlot = {
  /** Teks dengan placeholder {field}, mis. "{licenseType} license certificate". */
  text: string;
  page?: number; // 1-based, bawaan 1
  x: number;
  /** Garis dasar (baseline) teks. */
  y: number;
  size: number;
  font?: OverlayFont;
  color?: string;
  /** Lebar maksimum — teks lebih panjang diperkecil sampai muat. */
  maxWidth?: number;
  /** Kotak penutup nilai contoh bawaan desain (opsional). */
  cover?: { x: number; y: number; w: number; h: number; color: string };
};

export type OverlayPhoto = {
  page?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Warna latar di balik foto (menutup foto contoh). */
  bg?: string;
};

export type OverlayLayout = {
  refWidth: number;
  slots: OverlaySlot[];
  photo?: OverlayPhoto;
};

export const OVERLAY_FIELDS = [
  "licenseId",
  "licenseType", // "Standard" / "Premium"
  "photoTitle",
  "photographer",
  "issuedDate", // "Sep 27, 2026"
  "expiryText",
  "issuedTo", // nama pemegang lisensi
  "username",
  "userId",
  "itemUrl",
  "orderId",
] as const;
export type OverlayData = Record<(typeof OVERLAY_FIELDS)[number], string>;

const INK = "#0c0d0f"; // warna sel & header desain Lakunastock
const WHITE = "#ffffff";

const cell = (y: number, text: string, x = 37.6, textX = 41.3, w = 49.7) => ({
  text,
  x: textX,
  y: y + 1.95,
  size: 2.0,
  font: "bold" as const,
  color: WHITE,
  maxWidth: 87.2 - textX - 1.5,
  cover: { x, y: y - 0.02, w, h: 5.66, color: INK },
});

/** Diukur dari desain Lakunastock (lihat komentar berkas). */
export const DEFAULT_OVERLAY_LAYOUT: OverlayLayout = {
  refWidth: 93,
  slots: [
    {
      text: "{licenseType} license certificate",
      x: 4.8,
      y: 126.6,
      size: 2.5,
      font: "regular",
      color: WHITE,
      maxWidth: 58,
      cover: { x: 3.6, y: 124.9, w: 60, h: 4.4, color: INK },
    },
    // Judul yang sama di halaman 2 (aturan pakai).
    {
      text: "{licenseType} license certificate",
      page: 2,
      x: 4.8,
      y: 126.6,
      size: 2.5,
      font: "regular",
      color: WHITE,
      maxWidth: 58,
      cover: { x: 3.6, y: 124.9, w: 60, h: 4.4, color: INK },
    },
    cell(71.07, "{licenseType} License"),
    cell(65.17, "{photographer}"),
    cell(59.17, "{issuedDate}"),
    cell(53.17, "{itemUrl}"),
    cell(37.47, "{username}", 37.4, 41.1, 49.7),
    cell(31.47, "{userId}", 37.4, 41.1, 49.7),
  ],
  photo: { x: 21.6, y: 84.75, w: 49.6, h: 33.1, bg: WHITE },
};

function hex(c: string | undefined, fallback = "#000000") {
  const m = /^#?([0-9a-f]{6})$/i.exec(c ?? "") ?? /^#?([0-9a-f]{6})$/i.exec(fallback)!;
  const n = parseInt(m[1]!, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const FONT_DIR = join(process.cwd(), "assets", "fonts");
const FONT_FILES: Record<OverlayFont, string> = {
  regular: "Poppins-Regular.ttf",
  semibold: "Poppins-SemiBold.ttf",
  bold: "Poppins-Bold.ttf",
};
const fontCache = new Map<OverlayFont, Buffer>();
function fontBytes(f: OverlayFont): Buffer {
  let b = fontCache.get(f);
  if (!b) {
    b = readFileSync(join(FONT_DIR, FONT_FILES[f]));
    fontCache.set(f, b);
  }
  return b;
}

function fill(text: string, data: OverlayData): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (data as Record<string, string>)[k] ?? "");
}

/** Validasi & normalisasi tata letak dari CMS (throw bila rusak). */
export function parseOverlayLayout(raw: unknown): OverlayLayout {
  const l = (typeof raw === "string" ? JSON.parse(raw) : raw) as OverlayLayout;
  const num = (v: unknown, name: string) => {
    if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Nilai "${name}" harus angka`);
    return v;
  };
  if (!l || typeof l !== "object" || !Array.isArray(l.slots)) throw new Error("Tata letak harus punya daftar slots");
  num(l.refWidth, "refWidth");
  if (l.slots.length > 40) throw new Error("Terlalu banyak slot (maks 40)");
  for (const [i, s] of l.slots.entries()) {
    if (typeof s.text !== "string" || s.text.length > 200) throw new Error(`Slot ${i + 1}: teks tidak valid`);
    num(s.x, `slots[${i}].x`);
    num(s.y, `slots[${i}].y`);
    num(s.size, `slots[${i}].size`);
    if (s.cover) ["x", "y", "w", "h"].forEach((k) => num((s.cover as Record<string, unknown>)[k], `slots[${i}].cover.${k}`));
  }
  if (l.photo) ["x", "y", "w", "h"].forEach((k) => num((l.photo as Record<string, unknown>)[k], `photo.${k}`));
  return l;
}

function drawSlot(page: PDFPage, s: OverlaySlot, font: PDFFont, k: number, data: OverlayData) {
  if (s.cover) {
    page.drawRectangle({ x: s.cover.x * k, y: s.cover.y * k, width: s.cover.w * k, height: s.cover.h * k, color: hex(s.cover.color, INK) });
  }
  const text = fill(s.text, data).replace(/\s+/g, " ").trim();
  if (!text) return;
  let size = s.size * k;
  const max = s.maxWidth ? s.maxWidth * k : Infinity;
  while (size > s.size * k * 0.55 && font.widthOfTextAtSize(text, size) > max) size *= 0.95;
  let out = text;
  // Masih kepanjangan di ukuran minimum → potong dengan elipsis.
  while (out.length > 1 && font.widthOfTextAtSize(out, size) > max) out = out.slice(0, -2) + "…";
  page.drawText(out, { x: s.x * k, y: s.y * k, size, font, color: hex(s.color, WHITE) });
}

/**
 * Tulis data lisensi di atas template. `photoJpeg` = foto yang dilisensikan
 * (JPEG); null → area foto dibiarkan seperti desain.
 */
export async function renderOverlayTemplate(
  templateBytes: Buffer,
  layout: OverlayLayout,
  data: OverlayData,
  photoJpeg: Buffer | null,
): Promise<Buffer> {
  const doc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  doc.registerFontkit(fontkit);
  const fonts = new Map<OverlayFont, PDFFont>();
  const fontFor = async (f: OverlayFont = "bold") => {
    let pf = fonts.get(f);
    if (!pf) {
      pf = await doc.embedFont(fontBytes(f), { subset: true });
      fonts.set(f, pf);
    }
    return pf;
  };
  const pages = doc.getPages();
  const pageAt = (n = 1) => pages[n - 1];

  if (layout.photo && photoJpeg) {
    const p = layout.photo;
    const page = pageAt(p.page);
    if (!page) return Buffer.from(await doc.save({ useObjectStreams: true }));
    const k = page.getWidth() / layout.refWidth;
    const box = { x: p.x * k, y: p.y * k, w: p.w * k, h: p.h * k };
    page.drawRectangle({ x: box.x, y: box.y, width: box.w, height: box.h, color: hex(p.bg, WHITE) });
    const img = await doc.embedJpg(photoJpeg);
    // Isi penuh kotak (cover); foto sudah dipotong ke rasio kotak oleh pemanggil.
    page.drawImage(img, { x: box.x, y: box.y, width: box.w, height: box.h });
  }

  for (const s of layout.slots) {
    const page = pageAt(s.page);
    if (!page) continue; // slot untuk halaman yang tidak ada di template ini
    drawSlot(page, s, await fontFor(s.font), page.getWidth() / layout.refWidth, data);
  }
  return Buffer.from(await doc.save({ useObjectStreams: true }));
}

/** Rasio lebar/tinggi kotak foto (untuk memotong foto sebelum ditempel). */
export function photoAspect(layout: OverlayLayout): number | null {
  return layout.photo ? layout.photo.w / layout.photo.h : null;
}

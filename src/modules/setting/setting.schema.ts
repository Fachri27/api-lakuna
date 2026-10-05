import { z } from "zod";

// Allowlist key yang boleh di-upsert. Key lain ditolak dengan 400
// VALIDATION_ERROR oleh middleware validate().
export const ALLOWED_SETTING_KEYS = [
  "standar_plan_price",
  "photo_price_presets",
  "contributor_share_percentage",
  // Daftar id foto (JSON array) yang dipilih admin sebagai foto penanda tiap lokasi di peta beranda.
  "map_plate_photos",
] as const;

// PATCH/PUT /settings/:key (upsert)
export const UpdateSettingSchema = z.object({
  params: z.object({
    key: z.enum(ALLOWED_SETTING_KEYS),
  }),
  body: z.object({
    value: z.coerce
      .string()
      .min(1, "Value harus diisi")
      .max(60000, "Value maksimal 60000 karakter"), // kolom Setting.value = TEXT (65 KB); daftar foto peta bisa panjang
  }),
});

export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>;

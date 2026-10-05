import { z } from "zod";

// Schema untuk GET /keywords
export const GetKeywordsSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
    search: z.string().max(100, "Search maksimal 100 karakter").optional(),
    // Saring per bahasa; kosong = semua.
    lang: z.enum(["id", "en"]).optional(),
  }),
});

export type GetKeywordsInput = z.infer<typeof GetKeywordsSchema>["query"];

// Schema untuk GET /keywords/:id
export const GetKeywordByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID keyword tidak valid"),
  }),
});

// Schema untuk POST /keywords
export const CreateKeywordSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Nama keyword harus diisi")
      .max(100, "Nama keyword maksimal 100 karakter")
      .trim(),
    // Bahasa kata kunci; default "id" (perilaku lama).
    lang: z.enum(["id", "en"]).default("id"),
  }),
});

export type CreateKeywordInput = z.infer<typeof CreateKeywordSchema>["body"];

// Schema untuk PATCH /keywords/:id
export const UpdateKeywordSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID keyword tidak valid"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Nama keyword harus diisi")
      .max(100, "Nama keyword maksimal 100 karakter")
      .trim(),
  }),
});

export type UpdateKeywordInput = z.infer<typeof UpdateKeywordSchema>;

// Schema untuk DELETE /keywords/:id
export const DeleteKeywordSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID keyword tidak valid"),
  }),
});

export type DeleteKeywordInput = z.infer<typeof DeleteKeywordSchema>["params"];
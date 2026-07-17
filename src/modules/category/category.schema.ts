import { z } from "zod";

// Schema untuk GET /categories
export const GetCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
    search: z.string().optional(),
  }),
});

export type GetCategoriesInput = z.infer<typeof GetCategoriesSchema>["query"];

// Schema untuk GET /categories/:id
export const GetCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID category tidak valid"),
  }),
});

// Schema untuk POST /categories
export const CreateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Nama category harus diisi")
      .max(100, "Nama category maksimal 100 karakter")
      .trim(),
    description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>["body"];

// Schema untuk PATCH /categories/:id
export const UpdateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("ID category tidak valid"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Nama category harus diisi")
      .max(100, "Nama category maksimal 100 karakter")
      .trim()
      .optional(),
    description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  }),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// Schema untuk DELETE /categories/:id
export const DeleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("ID category tidak valid"),
  }),
});

export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>["params"];
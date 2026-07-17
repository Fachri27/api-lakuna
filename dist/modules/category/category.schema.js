import { z } from "zod";
// Schema untuk GET /categories
export const GetCategoriesSchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("20"),
        search: z.string().optional(),
    }),
});
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
// Schema untuk DELETE /categories/:id
export const DeleteCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("ID category tidak valid"),
    }),
});
//# sourceMappingURL=category.schema.js.map
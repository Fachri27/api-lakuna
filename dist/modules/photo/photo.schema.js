import { z } from "zod";
export const GetPhotosSchema = z.object({
    query: z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("12"),
    }),
});
// Schema untuk GET /photos/:id
export const GetPhotoByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
});
// Schema untuk GET /photos/:id/related
export const GetPhotoByRelated = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
});
// schema untuk upload
export const UploadPhotoSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(1, "Title harus diisi"),
        photographer: z
            .string()
            .min(1, "Photographer harus diisi"),
        price: z.coerce
            .number()
            .int("Price harus angka bulat")
            .min(0, "Price minimal 0"),
        description: z.string().optional(),
    }),
});
// Schema untuk PATCH /photos/:id
export const UpdatePhotoSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
    body: z.object({
        title: z.string().min(1, "Judul wajib diisi").optional(),
        description: z.string().optional(),
        photographer: z.string().optional(),
        price: z.coerce
            .number()
            .int("Harga harus angka bulat")
            .positive("Harga harus positif")
            .optional(),
    }),
});
// Schema untuk POST /photos/:id/keywords - tambah keyword ke photo
export const AddPhotoKeywordSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
    body: z.object({
        keywordIds: z.array(z.string().uuid("ID keyword tidak valid")).min(1, "Minimal 1 keyword"),
    }),
});
// Schema untuk DELETE /photos/:id/keywords/:keywordId - hapus keyword dari photo
export const RemovePhotoKeywordSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
        keywordId: z.string().uuid("ID keyword tidak valid"),
    }),
});
// Schema untuk POST /photos/:id/categories - tambah category ke photo
export const AddPhotoCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
    body: z.object({
        categoryIds: z.array(z.string().uuid("ID category tidak valid")).min(1, "Minimal 1 category"),
    }),
});
// Schema untuk DELETE /photos/:id/categories/:categoryId - hapus category dari photo
export const RemovePhotoCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
        categoryId: z.string().uuid("ID category tidak valid"),
    }),
});
//# sourceMappingURL=photo.schema.js.map
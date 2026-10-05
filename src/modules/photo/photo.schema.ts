import { z } from "zod";

export const GetPhotosSchema = z.object({
  query: z.object({
    search: z.string().max(100, "Search maksimal 100 karakter").optional(),
    categoryId: z.string().optional(),
    type: z.enum(["FOTO", "VIDEO"]).optional(),
    // Urutan hasil. Default terbaru; price_asc dipakai beranda untuk
    // menampilkan harga termurah per tipe ("mulai dari") tanpa menarik
    // seluruh arsip ke klien. popular = paling banyak diunduh, lalu paling
    // banyak difavoritkan, lalu terbaru (seri → terbaru).
    sort: z.enum(["newest", "oldest", "popular", "price_asc", "price_desc"]).optional(),
    // Batas waktu unggah: hanya yang dibuat dalam 24 jam / 7 hari / 30 hari / 365 hari terakhir.
    period: z.enum(["day", "week", "month", "year"]).optional(),
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("12"),
  }),
});

export type GetPhotosInput = z.infer<typeof GetPhotosSchema>["query"];


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
            .min(1, "Title harus diisi")
            .max(100, "Title maksimal 100 karakter"),

        photographer: z
            .string()
            .min(1, "Photographer harus diisi"),

        price: z.coerce
            .number()
            .int("Price harus angka bulat")
            .min(0, "Price minimal 0"),

        description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
        location: z.string().max(200, "Lokasi maksimal 200 karakter").optional(),
        // Penanda unggahan multi-berkas (satu judul, dikurasi terpisah).
        batchId: z
            .string()
            .regex(/^[A-Za-z0-9-]{8,64}$/, "batchId tidak valid")
            .optional(),
        // Case-insensitive: "foto"/"FOTO" sama-sama diterima, selebihnya
        // ditolak validate() (controller tidak lagi mem-parsing manual).
        type: z.preprocess(
            (v) => (typeof v === "string" ? v.toUpperCase() : v),
            z.enum(["FOTO", "VIDEO"]),
        ).optional(),
    }),
});


// Schema untuk PATCH /photos/:id
export const UpdatePhotoSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
    body: z.object({
        title: z.string().min(1, "Judul wajib diisi").max(100, "Title maksimal 100 karakter").optional(),
        description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
        photographer: z.string().optional(),
        location: z.string().max(200, "Lokasi maksimal 200 karakter").optional(),
        price: z.coerce
            .number()
            .int("Harga harus angka bulat")
            .positive("Harga harus positif")
            .optional(),
        type: z.enum(["FOTO", "VIDEO"]).optional(),
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

export type AddPhotoKeywordInput = z.infer<typeof AddPhotoKeywordSchema>;

// Schema untuk DELETE /photos/:id/keywords/:keywordId - hapus keyword dari photo
export const RemovePhotoKeywordSchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
        keywordId: z.string().uuid("ID keyword tidak valid"),
    }),
});

export type RemovePhotoKeywordInput = z.infer<typeof RemovePhotoKeywordSchema>;

// Schema untuk POST /photos/:id/categories - tambah category ke photo
export const AddPhotoCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
    }),
    body: z.object({
        categoryIds: z.array(z.string().uuid("ID category tidak valid")).min(1, "Minimal 1 category"),
    }),
});

export type AddPhotoCategoryInput = z.infer<typeof AddPhotoCategorySchema>;

// Schema untuk DELETE /photos/:id/categories/:categoryId - hapus category dari photo
export const RemovePhotoCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("ID foto tidak valid"),
        categoryId: z.string().uuid("ID category tidak valid"),
    }),
});

export type RemovePhotoCategoryInput = z.infer<typeof RemovePhotoCategorySchema>;

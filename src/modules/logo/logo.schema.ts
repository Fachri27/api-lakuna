import { z } from "zod";

export const ListLogosSchema = z.object({
  query: z.object({}).loose(),
});

export const CreateLogoSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama logo wajib diisi").max(80, "Nama maksimal 80 karakter"),
  }),
});

// PATCH: nama dan/atau berkas gambar (multipart, field `image`). Minimal salah satunya — dicek di controller.
export const UpdateLogoSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID logo tidak valid"),
  }),
  body: z.object({
    name: z.string().min(1, "Nama logo wajib diisi").max(80, "Nama maksimal 80 karakter").optional(),
  }),
});

export const DeleteLogoSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID logo tidak valid"),
  }),
});

export const OrderLogosSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1, "Minimal 1 logo"),
  }),
});

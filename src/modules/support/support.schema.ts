import { z } from "zod";

export const SUPPORT_TOPICS = ["pesanan", "unduhan", "langganan", "lisensi", "lainnya"] as const;
export const SUPPORT_STATUSES = ["NEW", "READ", "DONE"] as const;

export const CreateSupportMessageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
    email: z.string().trim().toLowerCase().email("Format email tidak valid").max(191, "Email terlalu panjang"),
    topic: z.enum(SUPPORT_TOPICS, { message: "Pilih topik" }),
    orderId: z.string().trim().max(64, "ID pesanan terlalu panjang").optional().or(z.literal("")),
    message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(2000, "Pesan maksimal 2000 karakter"),
    // Kolom jebakan untuk bot: manusia tak melihatnya, jadi harus kosong.
    website: z.string().max(200).optional(),
  }),
});

export const ListSupportMessagesSchema = z.object({
  query: z.object({
    status: z.enum(SUPPORT_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
});

export const UpdateSupportMessageSchema = z.object({
  params: z.object({ id: z.string().min(1, "ID tidak valid") }),
  body: z.object({ status: z.enum(SUPPORT_STATUSES, { message: "Status tidak valid" }) }),
});

import { z } from "zod";

// GET /vouchers
export const GetVouchersSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
    search: z.string().max(100, "Search maksimal 100 karakter").optional(),
    scope: z.enum(["ORDER", "SUBSCRIPTION", "BOTH"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

export type GetVouchersInput = z.infer<typeof GetVouchersSchema>["query"];

// GET /vouchers/:id
export const GetVoucherByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID voucher tidak valid"),
  }),
});

// POST /vouchers
export const CreateVoucherSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(3, "Kode minimal 3 karakter")
      .max(50, "Kode maksimal 50 karakter")
      .trim()
      .toUpperCase(),
    description: z.string().max(500).optional(),
    scope: z.enum(["ORDER", "SUBSCRIPTION", "BOTH"]).default("BOTH"),
    valueType: z.enum(["PERCENT", "NOMINAL"]).default("PERCENT"),
    value: z.number().int().min(1, "Value harus > 0"),
    maxDiscount: z.number().int().min(0).optional().nullable(),
    minSpend: z.number().int().min(0).optional().nullable(),
    startsAt: z.coerce.string(),
    endsAt: z.coerce.string(),
    isActive: z.boolean().default(true),
    quotaTotal: z.number().int().min(1).optional().nullable(),
    quotaPerUser: z.number().int().min(1).default(1),
  }).refine((d) => {
    if (d.valueType === "PERCENT" && d.value > 100) return false;
    return new Date(d.endsAt) > new Date(d.startsAt);
  }, {
    message: "endsAt harus setelah startsAt, dan persen maks 100",
    path: ["endsAt"],
  }),
});

export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>["body"];

// PATCH /vouchers/:id
export const UpdateVoucherSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID voucher tidak valid"),
  }),
  body: z.object({
    code: z
      .string()
      .min(3, "Kode minimal 3 karakter")
      .max(50, "Kode maksimal 50 karakter")
      .trim()
      .toUpperCase()
      .optional(),
    description: z.string().max(500).optional().nullable(),
    scope: z.enum(["ORDER", "SUBSCRIPTION", "BOTH"]).optional(),
    valueType: z.enum(["PERCENT", "NOMINAL"]).optional(),
    value: z.number().int().min(1).optional(),
    maxDiscount: z.number().int().min(0).optional().nullable(),
    minSpend: z.number().int().min(0).optional().nullable(),
    startsAt: z.coerce.string().optional(),
    endsAt: z.coerce.string().optional(),
    isActive: z.boolean().optional(),
    quotaTotal: z.number().int().min(1).optional().nullable(),
    quotaPerUser: z.number().int().min(1).optional(),
  }).refine((d) => {
    if (d.valueType === "PERCENT" && d.value !== undefined && d.value > 100) return false;
    if (d.startsAt && d.endsAt) {
      return new Date(d.endsAt) > new Date(d.startsAt);
    }
    return true;
  }, {
    message: "endsAt harus setelah startsAt, dan persen maks 100",
    path: ["endsAt"],
  }),
});

export type UpdateVoucherInput = z.infer<typeof UpdateVoucherSchema>;

// DELETE /vouchers/:id
export const DeleteVoucherSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID voucher tidak valid"),
  }),
});

// POST /vouchers/validate (publik, butuh auth untuk cek kuota per-user)
export const ValidateVoucherSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).trim(),
    scope: z.enum(["ORDER", "SUBSCRIPTION"]),
    amount: z.number().int().min(0),
  }),
});
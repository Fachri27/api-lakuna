import { z } from "zod";

const planIdParams = z.object({
  id: z.string().uuid("ID plan tidak valid"),
});

const nameField = z
  .string()
  .trim()
  .min(1, "Nama plan harus diisi")
  .max(120, "Nama plan maksimal 120 karakter");

const badgeField = z
  .string()
  .trim()
  .max(50, "Badge maksimal 50 karakter")
  .optional();

const descriptionField = z
  .string()
  .trim()
  .max(500, "Deskripsi maksimal 500 karakter")
  .optional();

const quotaField = z.coerce
  .number()
  .int("Quota harus angka bulat")
  .min(1, "Quota minimal 1")
  .max(1000000, "Quota maksimal 1000000");

const priceField = (label: string) =>
  z.coerce
    .number()
    .int(`${label} harus angka bulat`)
    .min(0, `${label} minimal 0`)
    .max(1000000000, `${label} maksimal 1000000000`);

// POST /plans
export const CreatePlanSchema = z.object({
  body: z.object({
    name: nameField,
    badge: badgeField,
    description: descriptionField,
    quota: quotaField,
    priceMonthly: priceField("priceMonthly"),
    priceAnnual: priceField("priceAnnual"),
    highlight: z.boolean().optional(),
  }),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>["body"];

// PATCH /plans/:id
export const UpdatePlanSchema = z.object({
  params: planIdParams,
  body: z.object({
    name: nameField.optional(),
    badge: badgeField,
    description: descriptionField,
    quota: quotaField.optional(),
    priceMonthly: priceField("priceMonthly").optional(),
    priceAnnual: priceField("priceAnnual").optional(),
    highlight: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;

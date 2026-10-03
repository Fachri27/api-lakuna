import { z } from "zod";

// GET /events
export const GetEventsSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
    search: z.string().max(100, "Search maksimal 100 karakter").optional(),
    targetType: z.enum(["PHOTO", "PLAN"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

// GET /events/active (publik) — event aktif untuk foto/plan tertentu
export const GetActiveEventsSchema = z.object({
  query: z.object({
    photoId: z.string().uuid().optional(),
    planId: z.string().uuid().optional(),
  }),
}).refine((d) => !!(d.query.photoId || d.query.planId), {
  message: "photoId atau planId wajib diisi",
  path: ["query"],
});

export type GetEventsInput = z.infer<typeof GetEventsSchema>["query"];

// GET /events/:id
export const GetEventByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID event tidak valid"),
  }),
});

// POST /events
export const CreateEventSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama event wajib diisi").max(120).trim(),
    description: z.string().max(500).optional(),
    valueType: z.enum(["PERCENT", "NOMINAL"]).default("PERCENT"),
    value: z.number().int().min(1, "Value harus > 0"),
    maxDiscount: z.number().int().min(0).optional().nullable(),
    startsAt: z.coerce.string(),
    endsAt: z.coerce.string(),
    isActive: z.boolean().default(true),
    targetType: z.enum(["PHOTO", "PLAN"]),
    photoIds: z.array(z.string().uuid()).optional(),
    planIds: z.array(z.string().uuid()).optional(),
  }).refine((d) => {
    if (d.valueType === "PERCENT" && d.value > 100) return false;
    if (!(new Date(d.endsAt) > new Date(d.startsAt))) return false;
    if (d.targetType === "PHOTO" && (!d.photoIds || d.photoIds.length === 0)) return false;
    if (d.targetType === "PLAN" && (!d.planIds || d.planIds.length === 0)) return false;
    return true;
  }, {
    message: "Cek endsAt>startsAt, persen maks 100, dan target ids tidak boleh kosong sesuai targetType",
    path: ["value"],
  }),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>["body"];

// PATCH /events/:id
export const UpdateEventSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID event tidak valid"),
  }),
  body: z.object({
    name: z.string().min(1).max(120).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    valueType: z.enum(["PERCENT", "NOMINAL"]).optional(),
    value: z.number().int().min(1).optional(),
    maxDiscount: z.number().int().min(0).optional().nullable(),
    startsAt: z.coerce.string().optional(),
    endsAt: z.coerce.string().optional(),
    isActive: z.boolean().optional(),
    targetType: z.enum(["PHOTO", "PLAN"]).optional(),
    photoIds: z.array(z.string().uuid()).optional(),
    planIds: z.array(z.string().uuid()).optional(),
  }).refine((d) => {
    if (d.valueType === "PERCENT" && d.value !== undefined && d.value > 100) return false;
    if (d.startsAt && d.endsAt && !(new Date(d.endsAt) > new Date(d.startsAt))) return false;
    return true;
  }, {
    message: "endsAt harus setelah startsAt, persen maks 100",
    path: ["endsAt"],
  }),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

// DELETE /events/:id
export const DeleteEventSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID event tidak valid"),
  }),
});
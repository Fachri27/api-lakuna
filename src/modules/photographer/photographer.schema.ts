import { z } from "zod";

export const GetPhotographersSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("50"),
    search: z.string().max(100, "Search maksimal 100 karakter").optional(),
  }),
});

export type GetPhotographersInput = z.infer<typeof GetPhotographersSchema>["query"];

export const GetPhotographerByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID fotografer tidak valid"),
  }),
});

export const CreatePhotographerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Nama fotografer harus diisi")
      .max(100, "Nama fotografer maksimal 100 karakter")
      .trim(),
    bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  }),
});

export type CreatePhotographerInput = z.infer<typeof CreatePhotographerSchema>["body"];

export const UpdatePhotographerSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID fotografer tidak valid"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Nama fotografer harus diisi")
      .max(100, "Nama fotografer maksimal 100 karakter")
      .trim(),
    bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  }),
});

export type UpdatePhotographerInput = z.infer<typeof UpdatePhotographerSchema>;

export const DeletePhotographerSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID fotografer tidak valid"),
  }),
});

export type DeletePhotographerInput = z.infer<typeof DeletePhotographerSchema>["params"];

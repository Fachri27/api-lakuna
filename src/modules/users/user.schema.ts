import { z } from "zod";

export const updateUserSchema = z.object({
    body: z.object({
        username:
            z.string()
            .min(3, "Username minimal ada 3 huruf")
            .optional(),

        realName:
            z.string()
            .min(3, "Real name minimal 3 huruf")
            .optional(),

        newsletter:
            z.coerce.boolean()
            .optional(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        current:
            z.string()
            .min(1, "Password saat ini wajib diisi")
            .max(72, "Password maksimal 72 karakter"),

        new:
            z.string()
            .min(6, "Password baru minimal 6 karakter")
            .max(72, "Password maksimal 72 karakter"),
    }),
});

export const newsletterSchema = z.object({
    body: z.object({
        active:
            z.coerce.boolean(),
    }),
});
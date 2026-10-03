import { z } from "zod";

export const RegisterSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username must be at most 30 characters long"),

    email: z.string().email("Invalid email address"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(72, "Password must be at most 72 characters long"),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().transform((val) => val.trim().toLowerCase()),
    password: z.string().max(72, "Password must be at most 72 characters long"),
  }),
});

export const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

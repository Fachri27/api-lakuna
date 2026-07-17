import { z } from "zod";

export const RegisterSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),

    email: z.string().email("Invalid email address"),

    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().transform((val) => val.trim().toLowerCase()),
    password: z.string().transform((val) => val.trim()),
  }),
});

export const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

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
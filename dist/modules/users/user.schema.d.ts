import { z } from "zod";
export declare const updateUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodOptional<z.ZodString>;
        realName: z.ZodOptional<z.ZodString>;
        newsletter: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=user.schema.d.ts.map
import { z } from "zod";
export declare const RegisterSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const LoginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        password: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RefreshSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=auth.schema.d.ts.map
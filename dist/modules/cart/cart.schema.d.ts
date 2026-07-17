import { z } from "zod";
export declare const AddToCartSchema: z.ZodObject<{
    body: z.ZodObject<{
        photoId: z.ZodString;
        license: z.ZodEnum<{
            STANDAR: "STANDAR";
            SUBSCRIBE: "SUBSCRIBE";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=cart.schema.d.ts.map
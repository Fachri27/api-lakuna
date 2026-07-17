import { z } from "zod";
export const AddToCartSchema = z.object({
    body: z.object({
        photoId: z.string().uuid(),
        license: z.enum(["STANDAR", "SUBSCRIBE"]),
    }),
});
//# sourceMappingURL=cart.schema.js.map
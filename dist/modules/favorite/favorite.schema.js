import { z } from "zod";
export const addFavoriteSchema = z.object({
    body: z.object({
        photoId: z.string().uuid(),
    }),
});
//# sourceMappingURL=favorite.schema.js.map
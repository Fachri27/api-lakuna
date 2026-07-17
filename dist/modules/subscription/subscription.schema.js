import z from "zod";
export const CreateSubscriptionSchema = z.object({
    body: z.object({
        planId: z.string().uuid("Plan tidak valid"),
        billing: z.enum(["annual", "monthly"]),
        payOption: z.enum(["monthly", "upfront"]),
    }),
});
//# sourceMappingURL=subscription.schema.js.map
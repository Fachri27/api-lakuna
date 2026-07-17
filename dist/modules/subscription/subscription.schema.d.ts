import z from "zod";
export declare const CreateSubscriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        planId: z.ZodString;
        billing: z.ZodEnum<{
            annual: "annual";
            monthly: "monthly";
        }>;
        payOption: z.ZodEnum<{
            monthly: "monthly";
            upfront: "upfront";
        }>;
    }, z.z.core.$strip>;
}, z.z.core.$strip>;
//# sourceMappingURL=subscription.schema.d.ts.map
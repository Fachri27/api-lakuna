import { z } from "zod";
export declare const GetKeywordsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        search: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type GetKeywordsInput = z.infer<typeof GetKeywordsSchema>["query"];
export declare const GetKeywordByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateKeywordSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateKeywordInput = z.infer<typeof CreateKeywordSchema>["body"];
export declare const UpdateKeywordSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UpdateKeywordInput = z.infer<typeof UpdateKeywordSchema>;
export declare const DeleteKeywordSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type DeleteKeywordInput = z.infer<typeof DeleteKeywordSchema>["params"];
//# sourceMappingURL=keyword.schema.d.ts.map
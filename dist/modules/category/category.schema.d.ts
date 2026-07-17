import { z } from "zod";
export declare const GetCategoriesSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        search: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type GetCategoriesInput = z.infer<typeof GetCategoriesSchema>["query"];
export declare const GetCategoryByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>["body"];
export declare const UpdateCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export declare const DeleteCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>["params"];
//# sourceMappingURL=category.schema.d.ts.map
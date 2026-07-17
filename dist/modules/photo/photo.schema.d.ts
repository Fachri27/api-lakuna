import { z } from "zod";
export declare const GetPhotosSchema: z.ZodObject<{
    query: z.ZodObject<{
        search: z.ZodOptional<z.ZodString>;
        categoryId: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type GetPhotosInput = z.infer<typeof GetPhotosSchema>["query"];
export declare const GetPhotoByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GetPhotoByRelated: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UploadPhotoSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        photographer: z.ZodString;
        price: z.ZodCoercedNumber<unknown>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdatePhotoSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        photographer: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const AddPhotoKeywordSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        keywordIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type AddPhotoKeywordInput = z.infer<typeof AddPhotoKeywordSchema>;
export declare const RemovePhotoKeywordSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
        keywordId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RemovePhotoKeywordInput = z.infer<typeof RemovePhotoKeywordSchema>;
export declare const AddPhotoCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        categoryIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type AddPhotoCategoryInput = z.infer<typeof AddPhotoCategorySchema>;
export declare const RemovePhotoCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
        categoryId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RemovePhotoCategoryInput = z.infer<typeof RemovePhotoCategorySchema>;
//# sourceMappingURL=photo.schema.d.ts.map
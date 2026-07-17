import { GetCategoriesInput, CreateCategoryInput } from "./category.schema.js";
export declare function getCategoriesService(query: GetCategoriesInput): Promise<{
    data: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function getCategoryByIdService(id: string): Promise<({
    photoCategories: ({
        photo: {
            id: string;
            title: string;
            thumbKey: string;
        };
    } & {
        id: string;
        categoryId: string;
        photoId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
}) | null>;
export declare function createCategoryService(data: CreateCategoryInput): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
}>;
export declare function updateCategoryService(id: string, data: {
    name?: string;
    description?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
}>;
export declare function deleteCategoryService(id: string): Promise<void>;
//# sourceMappingURL=category.service.d.ts.map
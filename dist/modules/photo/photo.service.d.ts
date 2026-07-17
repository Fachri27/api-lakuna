import { GetPhotosInput } from "./photo.schema.js";
type PhotoInput = {
    file: Express.Multer.File;
    title: string;
    description?: string;
    userId: string;
    photographer: string;
    price: number | string;
    type: "FOTO" | "VIDEO";
};
type UpdatePhotoInput = {
    id: string;
    title?: string;
    description?: string;
    photographer?: string;
    price?: number | string;
    file?: Express.Multer.File;
};
export declare function getPhotoService(query: GetPhotosInput): Promise<{
    data: {
        tags: string[];
        thumbUrl: string;
        watermarkUrl: string;
        originalUrl: string | null;
        photoKeywords: {
            keyword: {
                name: string;
            };
        }[];
        photoCategories: {
            category: {
                name: string;
            };
        }[];
        type: import(".prisma/client").$Enums.AssetType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        format: string | null;
        title: string;
        description: string | null;
        photographer: string | null;
        price: number;
        width: number | null;
        height: number | null;
        originalKey: string;
        thumbKey: string;
        watermarkKey: string;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function getPhotoByIdService(id: string): Promise<any>;
export declare function updatePhotoService(data: UpdatePhotoInput): Promise<{
    type: import(".prisma/client").$Enums.AssetType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    format: string | null;
    title: string;
    description: string | null;
    photographer: string | null;
    price: number;
    width: number | null;
    height: number | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
}>;
export declare function getPhotoByRelatedService(id: string): Promise<{
    thumbUrl: string | null;
    watermarkUrl: string | null;
    photoKeywords: {
        keyword: {
            name: string;
        };
    }[];
    type: import(".prisma/client").$Enums.AssetType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    format: string | null;
    title: string;
    description: string | null;
    photographer: string | null;
    price: number;
    width: number | null;
    height: number | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
}[]>;
export declare function uploadPhotoService(data: PhotoInput): Promise<{
    type: import(".prisma/client").$Enums.AssetType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    format: string | null;
    title: string;
    description: string | null;
    photographer: string | null;
    price: number;
    width: number | null;
    height: number | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
}>;
export declare function deletePhotoService(data: {
    userId: string;
    photoId: string;
    role: string;
}): Promise<void>;
export declare function addPhotoKeywordsService(photoId: string, keywordIds: string[]): Promise<{
    id: string;
    keywordId: string;
    photoId: string;
}[]>;
export declare function removePhotoKeywordService(photoId: string, keywordId: string): Promise<{
    success: boolean;
}>;
export declare function addPhotoCategoriesService(photoId: string, categoryIds: string[]): Promise<{
    id: string;
    categoryId: string;
    photoId: string;
}[]>;
export declare function removePhotoCategoryService(photoId: string, categoryId: string): Promise<{
    success: boolean;
}>;
export {};
//# sourceMappingURL=photo.service.d.ts.map
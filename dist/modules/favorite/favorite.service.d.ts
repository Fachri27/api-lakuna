export declare function getFavoriteService(userId: string): Promise<any>;
export declare function addFavoriteService(data: {
    userId: string;
    photoId: string;
}): Promise<{
    photo: {
        thumbUrl: string;
        watermarkUrl: string;
        type: import(".prisma/client").$Enums.AssetType;
        id: string;
        title: string;
        photographer: string | null;
        price: number;
        thumbKey: string;
        watermarkKey: string;
    };
    id: string;
    createdAt: Date;
    userId: string;
    photoId: string;
}>;
export declare function deleteFavoriteService(data: {
    userId: string;
    favId: string;
}): Promise<boolean>;
//# sourceMappingURL=favorite.service.d.ts.map
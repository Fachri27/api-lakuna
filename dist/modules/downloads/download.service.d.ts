export declare function getDownloadService(userId: string, query?: {
    page?: string;
    limit?: string;
}): Promise<{
    licenses: {
        photo: {
            thumbUrl: string;
            watermarkUrl: string;
            id: string;
            title: string;
            photographer: string | null;
            price: number;
            originalKey: string;
            thumbKey: string;
            watermarkKey: string;
        } | null;
        order: {
            id: string;
            createdAt: Date;
            total: number;
        } | null;
        type: import(".prisma/client").$Enums.LicenseType;
        id: string;
        createdAt: Date;
        userId: string;
        photoId: string | null;
        expiresAt: Date | null;
        licenseKey: string | null;
        orderId: string | null;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function downloadPhotoService(data: {
    userId: string;
    photoId: string;
}): Promise<string>;
//# sourceMappingURL=download.service.d.ts.map
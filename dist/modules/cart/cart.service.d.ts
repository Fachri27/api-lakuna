import { LicenseType } from "@prisma/client";
export declare function getCartService(userId: string): Promise<any>;
export declare function addToCartService(data: {
    userId: string;
    photoId: string;
    license: LicenseType;
}): Promise<{
    price: number;
    thumbUrl: string;
    photo: {
        id: string;
        title: string;
        price: number;
        thumbKey: string;
    };
    id: string;
    createdAt: Date;
    userId: string;
    photoId: string;
    license: import(".prisma/client").$Enums.LicenseType;
}>;
export declare function deleteCartService(data: {
    userId: string;
    cartId: string;
}): Promise<boolean>;
//# sourceMappingURL=cart.service.d.ts.map
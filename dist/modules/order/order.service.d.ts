export declare function getOrdersService(userId: string): Promise<{
    continuePaymentUrl: string | null;
    items: {
        photo: {
            thumbUrl: string;
            id: string;
            title: string;
            thumbKey: string;
        };
        id: string;
        price: number;
        photoId: string;
        orderId: string;
        licenseType: import(".prisma/client").$Enums.LicenseType;
    }[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    total: number;
    status: import(".prisma/client").$Enums.OrderStatus;
    midtransOrderId: string | null;
    midtransToken: string | null;
    paidAt: Date | null;
    standarLicenseRedeemed: boolean;
}[]>;
export declare function getOrdersAdminService(page: number, limit: number): Promise<{
    data: {
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        total: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        license: import(".prisma/client").$Enums.LicenseType | undefined;
        createdAt: Date;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function createOrderService(data: {
    userId: string;
    email?: string;
}): Promise<{
    orderId: string;
    snapToken: string;
    redirectUrl: string;
}>;
//# sourceMappingURL=order.service.d.ts.map
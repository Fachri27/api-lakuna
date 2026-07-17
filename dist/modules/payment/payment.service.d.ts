export declare function paymentWebhookService(payload: any): Promise<{
    status: string;
}>;
export declare function getPaymentStatusService(data: {
    userId: string;
    orderId: string;
}): Promise<{
    orderId: string;
    orderStatus: import(".prisma/client").$Enums.OrderStatus;
    midtransOrderId: string;
    total: number;
    items: ({
        photo: {
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
        };
    } & {
        id: string;
        price: number;
        photoId: string;
        orderId: string;
        licenseType: import(".prisma/client").$Enums.LicenseType;
    })[];
}>;
export declare function checkAndProcessOrderStatus(data: {
    userId: string;
    orderId: string;
}): Promise<{
    status: string;
}>;
//# sourceMappingURL=payment.service.d.ts.map
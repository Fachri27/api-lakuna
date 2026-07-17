export declare function getSubscriptionService(userId: string, bypassCache?: boolean): Promise<any>;
export declare function invalidateSubscriptionCache(userId: string): Promise<void>;
export declare function refreshSubscriptionCache(userId: string): Promise<any>;
export declare function createSubscriptionService(data: {
    userId: string;
    planId: string;
    billing: string;
    payOption: string;
    price: number;
    quota: number;
    orderId: string;
    snapToken: string;
    redirectUrl?: string;
}): Promise<{
    snapToken: string;
    redirectUrl: string | undefined;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    price: number;
    quota: number;
    used: number;
    billing: string;
    payOption: string;
    status: import(".prisma/client").$Enums.SubscriptionStatus;
    midtransOrderId: string | null;
    startedAt: Date;
    expiresAt: Date;
    planId: string;
}>;
export declare function cancelSubscriptionService(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    price: number;
    quota: number;
    used: number;
    billing: string;
    payOption: string;
    status: import(".prisma/client").$Enums.SubscriptionStatus;
    midtransOrderId: string | null;
    startedAt: Date;
    expiresAt: Date;
    planId: string;
} | {
    message: string;
}>;
export declare function createStandarPurchaseService(data: {
    userId: string;
    orderId: string;
    snapToken: string;
    redirectUrl?: string;
    price: number;
}): Promise<{
    orderId: string;
    snapToken: string;
    redirectUrl: string | undefined;
}>;
export declare function getStandarLicenseService(userId: string): Promise<{
    orderId: string;
    canRedeem: boolean;
} | null>;
export declare function redeemStandarLicenseService(data: {
    userId: string;
    photoId: string;
}): Promise<{
    type: import(".prisma/client").$Enums.LicenseType;
    id: string;
    createdAt: Date;
    userId: string;
    photoId: string | null;
    expiresAt: Date | null;
    licenseKey: string | null;
    orderId: string | null;
}>;
//# sourceMappingURL=subscription.service.d.ts.map
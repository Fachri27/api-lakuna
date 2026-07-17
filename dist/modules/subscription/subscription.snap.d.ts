export declare function createSubscriptionSnap(data: {
    userId: string;
    planId: string;
    billing: "annual" | "monthly";
}): Promise<{
    snapToken: any;
    redirectUrl: any;
    orderId: string;
    price: number;
    plan: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quota: number;
        priceMonthly: number;
        priceAnnual: number;
        isActive: boolean;
    };
}>;
export declare function createStandarSnap(data: {
    userId: string;
}): Promise<{
    snapToken: any;
    redirectUrl: any;
    orderId: string;
    price: number;
}>;
//# sourceMappingURL=subscription.snap.d.ts.map
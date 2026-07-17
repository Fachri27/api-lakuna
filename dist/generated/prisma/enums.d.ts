export declare const Role: {
    readonly USER: "USER";
    readonly ADMIN: "ADMIN";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const AssetType: {
    readonly FOTO: "FOTO";
    readonly VIDEO: "VIDEO";
};
export type AssetType = (typeof AssetType)[keyof typeof AssetType];
export declare const OrderStatus: {
    readonly PENDING: "PENDING";
    readonly PAID: "PAID";
    readonly CANCELLED: "CANCELLED";
    readonly EXPIRED: "EXPIRED";
};
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export declare const SubscriptionStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly CANCELLED: "CANCELLED";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
//# sourceMappingURL=enums.d.ts.map
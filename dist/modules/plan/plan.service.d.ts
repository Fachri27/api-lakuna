export declare function getAllPlansService(): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    quota: number;
    priceMonthly: number;
    priceAnnual: number;
    isActive: boolean;
}[]>;
export declare function createPlanService(data: {
    quota: number;
    priceMonthly: number;
    priceAnnual: number;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    quota: number;
    priceMonthly: number;
    priceAnnual: number;
    isActive: boolean;
}>;
export declare function updatePlanService(id: string, data: {
    quota?: number;
    priceMonthly?: number;
    priceAnnual?: number;
    isActive?: boolean;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    quota: number;
    priceMonthly: number;
    priceAnnual: number;
    isActive: boolean;
}>;
export declare function deletePlanService(id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    quota: number;
    priceMonthly: number;
    priceAnnual: number;
    isActive: boolean;
}>;
//# sourceMappingURL=plan.service.d.ts.map
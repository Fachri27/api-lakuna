export declare function getSettingService(key: string): Promise<{
    createdAt: Date;
    updatedAt: Date;
    value: string;
    key: string;
} | {
    key: string;
    value: string;
} | null>;
export declare function getSettingsService(): Promise<{
    createdAt: Date;
    updatedAt: Date;
    value: string;
    key: string;
}[]>;
export declare function updateSettingService(key: string, value: string): Promise<{
    createdAt: Date;
    updatedAt: Date;
    value: string;
    key: string;
}>;
//# sourceMappingURL=setting.service.d.ts.map
export declare function generateLicensePdf(license: {
    id: string;
    photoTitle: string;
    photographer: string;
    licenseType: string;
    createdAt: Date;
    expiresAt?: Date | null;
    issuedTo?: string;
    orderId?: string | null;
}): Promise<string>;
//# sourceMappingURL=generateLicensePdf.d.ts.map
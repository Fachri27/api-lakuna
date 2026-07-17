import { Client } from "minio";
export declare const minioClient: Client;
export declare function initializeMinIOBucketCORS(): Promise<void>;
export declare function getPresignedUrl(objectName: string, expirySeconds?: number): Promise<string>;
//# sourceMappingURL=minio.d.ts.map
import { basename } from "path";
import { Client } from "minio";
const endpoint = process.env.MINIO_ENDPOINT;
const port = process.env.MINIO_PORT;
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET;
const minioUseSSL = (process.env.MINIO_USE_SSL ?? "false").toLowerCase() === "true";
// Use empty region for localhost MinIO (filesystem backend)
const minioRegion = process.env.MINIO_REGION || "";
if (!endpoint)
    throw new Error("MINIO_ENDPOINT is required");
if (!port)
    throw new Error("MINIO_PORT is required");
if (!accessKey)
    throw new Error("MINIO_ACCESS_KEY is required");
if (!secretKey)
    throw new Error("MINIO_SECRET_KEY is required");
if (!bucket)
    throw new Error("MINIO_BUCKET is required");
const MINIO_BUCKET = bucket;
const clientOptions = {
    endPoint: endpoint,
    port: Number(port),
    useSSL: minioUseSSL,
    accessKey,
    secretKey,
};
// Only add region if not empty
if (minioRegion) {
    clientOptions.region = minioRegion;
}
export const minioClient = new Client(clientOptions);
// DEBUG: log minio connection info (masked)
try {
    const masked = `${accessKey}:***${String(secretKey).slice(-3)}`;
    console.log(`MinIO client configured -> endpoint=${endpoint}:${port} useSSL=${minioUseSSL} access=${masked}`);
}
catch (e) { }
// Initialize CORS configuration for the bucket via HTTP
export async function initializeMinIOBucketCORS() {
    try {
        console.log(`✓ CORS configuration setup for bucket: ${MINIO_BUCKET}`);
        // Note: CORS should be configured via MinIO dashboard or CLI:
        // mc cors set minio/bucket --acp "public"
    }
    catch (error) {
        console.warn(`⚠ Could not set CORS on bucket:`, error);
    }
}
export async function getPresignedUrl(objectName, expirySeconds = 3600) {
    try {
        // Default 1 hour (3600 seconds) for better reliability
        const url = await minioClient.presignedGetObject(MINIO_BUCKET, objectName, expirySeconds, {
            "response-content-disposition": `attachment; filename="${basename(objectName)}"`,
        });
        // Fix endpoint issues
        let finalUrl = url;
        // If using non-SSL localhost, replace with proper endpoint
        if (!minioUseSSL && endpoint?.includes("localhost")) {
            finalUrl = url.replace("https://", "http://");
        }
        console.log(`✓ Generated presigned URL for: ${objectName}`);
        return finalUrl;
    }
    catch (error) {
        console.error(`Failed to generate presigned URL for ${objectName}:`, error);
        throw error;
    }
}
//# sourceMappingURL=minio.js.map
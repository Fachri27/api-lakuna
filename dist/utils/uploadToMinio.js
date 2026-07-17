import { minioClient } from "../config/minio.js";
const envBucket = process.env.MINIO_BUCKET;
if (!envBucket)
    throw new Error("MINIO_BUCKET is required");
const BUCKET = envBucket;
export async function uploadBuffer(objectName, buffer, mimetype) {
    await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
        "Content-Type": mimetype,
    });
    return objectName;
}
//# sourceMappingURL=uploadToMinio.js.map
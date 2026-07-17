import { minioClient } from "../config/minio.js";

const envBucket = process.env.MINIO_BUCKET;
if (!envBucket) throw new Error("MINIO_BUCKET is required");
const BUCKET: string = envBucket;

export async function uploadBuffer(
    objectName: string,
    buffer: Buffer,
    mimetype: string,
) {
    await minioClient.putObject(
        BUCKET,
        objectName,
        buffer,
        buffer.length,
        {
            "Content-Type": mimetype,
        }
    );

    return objectName;
}
import { minioClient } from "../config/minio.js";

const envBucket = process.env.MINIO_BUCKET;
if (!envBucket) throw new Error("MINIO_BUCKET is required");
const BUCKET: string = envBucket;

export async function uploadBuffer(
    objectName: string,
    buffer: Buffer,
    mimetype: string,
) {
    const put = () =>
        minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
            "Content-Type": mimetype,
        });
    try {
        await put();
    } catch (err) {
        // Proses sinkron panjang (mis. ffmpeg video besar) memblokir event
        // loop; socket keep-alive ke MinIO basi dan permintaan PERTAMA
        // sesudahnya putus ("socket hang up" / ECONNRESET). Satu percobaan
        // ulang membuka socket baru.
        const msg = (err as Error)?.message ?? "";
        const code = (err as { code?: string })?.code ?? "";
        if (!/socket hang up/i.test(msg) && code !== "ECONNRESET" && code !== "EPIPE") throw err;
        await put();
    }

    return objectName;
}
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

/**
 * Unggah dari BERKAS di disk (stream) — untuk media besar (video hero) agar tak
 * dimuat penuh ke memori. Satu percobaan ulang untuk socket basi, seperti
 * uploadBuffer.
 */
export async function uploadFile(objectName: string, filePath: string, mimetype: string) {
    const put = () => minioClient.fPutObject(BUCKET, objectName, filePath, { "Content-Type": mimetype });
    try {
        await put();
    } catch (err) {
        const msg = (err as Error)?.message ?? "";
        const code = (err as { code?: string })?.code ?? "";
        if (!/socket hang up/i.test(msg) && code !== "ECONNRESET" && code !== "EPIPE") throw err;
        await put();
    }
    return objectName;
}

import { Redis } from "ioredis";

// Bersihkan salah ketik umum saat menempel variabel di dashboard (spasi, tanda
// kutip, titik/koma di akhir). URL berakhiran "6379." dibaca ioredis sebagai
// nomor database "NaN" -> "ERR value is not an integer" saat SELECT.
const redisUrl = process.env.REDIS_URL?.trim()
  .replace(/^["']+|["']+$/g, "")
  .replace(/[.,;\s]+$/, "");
if (!redisUrl) throw new Error("REDIS_URL is required");

export const redisClient = new Redis(redisUrl);

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

export async function deleteKeysByPattern(pattern: string) {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redisClient.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } while (cursor !== "0");
}
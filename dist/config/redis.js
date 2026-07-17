import { Redis } from "ioredis";
const redisUrl = process.env.REDIS_URL;
if (!redisUrl)
    throw new Error("REDIS_URL is required");
export const redisClient = new Redis(redisUrl);
redisClient.on("connect", () => {
    console.log("Connected to Redis");
});
redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});
export async function deleteKeysByPattern(pattern) {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    } while (cursor !== "0");
}
//# sourceMappingURL=redis.js.map
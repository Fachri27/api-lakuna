import { prisma } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { SubscriptionStatus } from "@prisma/client";
export async function getSubscriptionService(userId, bypassCache = false) {
    // cek cache - skip jika bypassCache = true
    if (!bypassCache) {
        const cache = await redisClient.get(`subscription:${userId}`);
        if (cache)
            return JSON.parse(cache);
    }
    const subscription = await prisma.subscription.findUnique({
        where: {
            userId,
        },
    });
    if (!subscription) {
        return {
            plan: "FREE",
            quota: 0,
            used: 0,
            remaining: 0,
            status: "INACTIVE",
        };
    }
    // auto expire
    const now = new Date();
    if (subscription.expiresAt < now && subscription.status === "ACTIVE") {
        const expired = await prisma.subscription.update({
            where: {
                id: subscription.id,
            },
            data: {
                status: SubscriptionStatus.EXPIRED,
            },
        });
        const result = {
            ...expired,
            remaining: expired.quota - expired.used,
        };
        // Kurangi TTL cache dari 300 detik (5 menit) jadi 30 detik
        await redisClient.set(`subscription:${userId}`, JSON.stringify(result), "EX", 30);
        return result;
    }
    const result = {
        ...subscription,
        remaining: subscription.quota - subscription.used,
    };
    // Kurangi TTL cache dari 300 detik (5 menit) jadi 30 detik
    await redisClient.set(`subscription:${userId}`, JSON.stringify(result), "EX", 30);
    return result;
}
// Fungsi untuk invalidate cache subscription
export async function invalidateSubscriptionCache(userId) {
    await redisClient.del(`subscription:${userId}`);
}
// Fungsi untuk refresh cache (delete cache dan fetch fresh data)
export async function refreshSubscriptionCache(userId) {
    await invalidateSubscriptionCache(userId);
    return await getSubscriptionService(userId, true);
}
export async function createSubscriptionService(data) {
    const existing = await prisma.subscription.findUnique({
        where: { userId: data.userId },
    });
    if (existing?.status === SubscriptionStatus.ACTIVE) {
        throw new AppError(409, "ALREADY_SUBSCRIBED", "Kamu sudah memiliki subscription aktif");
    }
    const expiresAt = new Date();
    if (data.billing === "annual") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    const subscription = existing
        ? await prisma.subscription.update({
            where: { userId: data.userId },
            data: {
                planId: data.planId,
                quota: data.quota,
                used: 0,
                billing: data.billing,
                payOption: data.payOption,
                price: data.price,
                status: SubscriptionStatus.PENDING,
                midtransOrderId: data.orderId,
                expiresAt,
                startedAt: new Date(),
            },
        })
        : await prisma.subscription.create({
            data: {
                userId: data.userId,
                planId: data.planId,
                quota: data.quota,
                used: 0,
                billing: data.billing,
                payOption: data.payOption,
                price: data.price,
                status: SubscriptionStatus.PENDING,
                midtransOrderId: data.orderId,
                expiresAt,
            },
        });
    await redisClient.del(`subscription:${data.userId}`);
    return { ...subscription, snapToken: data.snapToken, redirectUrl: data.redirectUrl };
}
// Cancel subscription
export async function cancelSubscriptionService(userId) {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });
    if (!subscription) {
        throw new AppError(404, "NOT_FOUND", "Subscription tidak ditemukan");
    }
    if (subscription.status === SubscriptionStatus.CANCELLED) {
        return { message: "Subscription sudah dibatalkan" };
    }
    const updated = await prisma.subscription.update({
        where: { userId },
        data: {
            status: SubscriptionStatus.CANCELLED,
        },
    });
    await redisClient.del(`subscription:${userId}`);
    return updated;
}
// Standar plan - one time purchase (bukan subscription)
export async function createStandarPurchaseService(data) {
    return await prisma.$transaction(async (tx) => {
        // Buat order untuk standar plan
        const order = await tx.order.create({
            data: {
                userId: data.userId,
                total: data.price,
                status: "PENDING",
                midtransOrderId: data.orderId,
                midtransToken: data.snapToken,
            },
        });
        return {
            orderId: order.id,
            snapToken: data.snapToken,
            redirectUrl: data.redirectUrl,
        };
    });
}
export async function getStandarLicenseService(userId) {
    const order = await prisma.order.findFirst({
        where: {
            userId,
            status: "PAID",
            standarLicenseRedeemed: false,
        },
    });
    if (!order)
        return null;
    return {
        orderId: order.id,
        canRedeem: true,
    };
}
// Redeem standar license untuk foto tertentu
export async function redeemStandarLicenseService(data) {
    const order = await prisma.order.findFirst({
        where: {
            userId: data.userId,
            status: "PAID",
            standarLicenseRedeemed: false,
        },
    });
    if (!order) {
        throw new AppError(404, "NO_STANDAR_LICENSE", "Anda belum membeli paket standar");
    }
    // Buat license
    const license = await prisma.license.create({
        data: {
            userId: data.userId,
            photoId: data.photoId,
            type: "STANDAR",
            orderId: order.id,
        },
    });
    // Tandai order sudah dipakai
    await prisma.order.update({
        where: { id: order.id },
        data: { standarLicenseRedeemed: true },
    });
    return license;
}
//# sourceMappingURL=subscription.service.js.map
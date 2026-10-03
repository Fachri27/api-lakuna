import { prisma } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";
import { randomUUID } from "crypto";
import { AppError } from "../../middlewares/errorHandler.js";
import { SubscriptionStatus } from "@prisma/client";
import { claimVoucherQuota } from "../discount/discount.service.js";

export async function getSubscriptionService(userId: string, bypassCache = false) {
  // cek cache - skip jika bypassCache = true
  if (!bypassCache) {
    const cache = await redisClient.get(`subscription:${userId}`);
    if (cache) return JSON.parse(cache);
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
    await redisClient.set(
      `subscription:${userId}`,
      JSON.stringify(result),
      "EX",
      30,
    );

    return result;
  }

  const result = {
    ...subscription,
    remaining: subscription.quota - subscription.used,
  };

  // Kurangi TTL cache dari 300 detik (5 menit) jadi 30 detik
  await redisClient.set(
    `subscription:${userId}`,
    JSON.stringify(result),
    "EX",
    30,
  );

  return result;
}

// Fungsi untuk invalidate cache subscription
export async function invalidateSubscriptionCache(userId: string) {
  await redisClient.del(`subscription:${userId}`);
}

// Fungsi untuk refresh cache (delete cache dan fetch fresh data)
export async function refreshSubscriptionCache(userId: string) {
  await invalidateSubscriptionCache(userId);
  return await getSubscriptionService(userId, true);
}

export async function createSubscriptionService(data: {
  userId: string;
  planId: string;
  billing: string;
  payOption: string;
  price: number;
  quota: number;
  orderId: string;
  snapToken: string | null;
  redirectUrl?: string;
  discountAmount?: number | undefined;
  voucherId?: string | undefined;
}) {
  const existing = await prisma.subscription.findUnique({
    where: { userId: data.userId },
  });

  if (existing?.status === SubscriptionStatus.ACTIVE) {
    throw new AppError(
      409,
      "ALREADY_SUBSCRIBED",
      "Kamu sudah memiliki subscription aktif",
    );
  }

  const expiresAt = new Date();
  if (data.billing === "annual") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  // B4: order gratis (grossAmount 0, tanpa Snap) langsung ACTIVE.
  const isFree = Math.max(0, data.price - (data.discountAmount ?? 0)) === 0;
  const initialStatus = isFree
    ? SubscriptionStatus.ACTIVE
    : SubscriptionStatus.PENDING;

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
          discountAmount: data.discountAmount ?? 0,
          voucherId: data.voucherId ?? null,
          status: initialStatus,
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
          discountAmount: data.discountAmount ?? 0,
          voucherId: data.voucherId ?? null,
          status: initialStatus,
          midtransOrderId: data.orderId,
          expiresAt,
        },
      });

  // Create BillingInstallment records for annual+monthly
  if (data.billing === "annual" && data.payOption === "monthly") {
    const installmentAmount = data.price; // priceMonthly
    const installments = [];
    for (let i = 1; i <= 12; i++) {
      installments.push({
        subscriptionId: subscription.id,
        monthNumber: i,
        amount: installmentAmount,
        status: "PENDING" as const,
        midtransOrderId: i === 1 ? data.orderId : null,
        snapToken: i === 1 ? data.snapToken : null,
      });
    }
    await prisma.billingInstallment.createMany({ data: installments });
  }

  // B4: tanpa webhook untuk order gratis, catat pemakaian voucher di sini
  // (idempoten — aman bila webhook/polling memanggil lagi untuk order ini).
  // Pentest tahap-2 fix: claimVoucherQuota menggantikan pencatatan polos —
  // kuota total + per-user diklaim atomik, bukan read-then-write TOCTOU.
  if (isFree && data.voucherId && (data.discountAmount ?? 0) > 0) {
    await prisma.$transaction(async (tx) => {
      await claimVoucherQuota(tx, {
        voucherId: data.voucherId as string,
        userId: data.userId,
        amountCut: data.discountAmount as number,
        subscriptionId: subscription.id,
      });
    });
  }

  await redisClient.del(`subscription:${data.userId}`);

  return { ...subscription, snapToken: data.snapToken, redirectUrl: data.redirectUrl };
}

export async function getInstallmentsService(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return [];

  const installments = await prisma.billingInstallment.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { monthNumber: "asc" },
  });

  return { subscriptionId: subscription.id, installments };
}

export async function payRemainingBalanceService(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription tidak ditemukan");
  }

  if (subscription.payOption !== "monthly") {
    throw new AppError(400, "BAD_REQUEST", "Hanya untuk subscription dengan opsi bayar per bulan");
  }

  const pending = await prisma.billingInstallment.findMany({
    where: {
      subscriptionId: subscription.id,
      status: "PENDING",
    },
  });

  if (pending.length === 0) {
    throw new AppError(400, "ALL_PAID", "Semua cicilan sudah lunas");
  }

  const totalRemaining = pending.reduce((sum, inst) => sum + inst.amount, 0);
  // B7: suffix acak agar order_id unik (Midtrans menolak order_id duplikat).
  const orderId = `INST-BULK-${userId}-${Date.now()}-${randomUUID().slice(0, 8)}`;

  return { totalRemaining, orderId, installmentCount: pending.length };
}

// Admin - list all subscriptions
export async function getAdminSubscriptionsService() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: {
        select: { id: true, username: true, email: true },
      },
      plan: {
        select: { quota: true, priceMonthly: true, priceAnnual: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions.map((sub) => ({
    id: sub.id,
    userId: sub.userId,
    userName: sub.user.username,
    userEmail: sub.user.email,
    planQuota: sub.plan?.quota ?? sub.quota,
    billing: sub.billing,
    payOption: sub.payOption,
    price: sub.price,
    status: sub.status,
    used: sub.used,
    quota: sub.quota,
    expiresAt: sub.expiresAt,
    startedAt: sub.startedAt,
    createdAt: sub.createdAt,
  }));
}

// Admin - expire a user's subscription
export async function expireSubscriptionByAdminService(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription tidak ditemukan");
  }

  if (subscription.status === SubscriptionStatus.EXPIRED) {
    throw new AppError(400, "ALREADY_EXPIRED", "Subscription sudah expired");
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.EXPIRED,
      expiresAt: new Date(),
    },
  });

  await redisClient.del(`subscription:${userId}`);

  return updated;
}

// Cancel subscription
export async function cancelSubscriptionService(userId: string) {
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
  export async function createStandarPurchaseService(data: {
    userId: string;
    orderId: string;
    snapToken: string | null;
    redirectUrl?: string;
    price: number;
    discountAmount?: number | undefined;
    voucherId?: string | undefined;
    // Opsional: bila foto sudah diketahui saat checkout, sertakan OrderItem
    // standar konsisten dengan flow cart di order.service.ts
    // (photoId + licenseType STANDAR + price). Tanpa photoId, order tetap
    // dibuat tanpa item karena lisensi diikat ke foto saat redeem.
    photoId?: string | undefined;
    photoPrice?: number | undefined;
  }) {
    const discountAmount = data.discountAmount ?? 0;
    const total = Math.max(0, data.price - discountAmount);
    // B4: order gratis (grossAmount 0, tanpa Snap) langsung PAID + redeemable.
    const isFree = total === 0;
    return await prisma.$transaction(async (tx) => {
      // Buat order untuk standar plan
      const order = await tx.order.create({
        data: {
          userId: data.userId,
          total,
          discountAmount,
          voucherId: data.voucherId ?? null,
          status: isFree ? "PAID" : "PENDING",
          paidAt: isFree ? new Date() : null,
          midtransOrderId: data.orderId,
          midtransToken: data.snapToken,
          // B4: sertakan OrderItem standar (konsisten dengan flow cart di
          // order.service.ts) bila foto sudah diketahui saat checkout.
          ...(data.photoId
            ? {
                items: {
                  create: [
                    {
                      photoId: data.photoId,
                      licenseType: "STANDAR" as const,
                      price: data.photoPrice ?? total,
                    },
                  ],
                },
              }
            : {}),
        },
      });

      // B4: tanpa webhook untuk order gratis, catat pemakaian voucher di sini
      // (idempoten — aman bila webhook/polling memanggil lagi untuk order ini).
      // Pentest tahap-2 fix: claimVoucherQuota menggantikan pencatatan polos —
      // kuota total + per-user diklaim atomik.
      if (isFree && data.voucherId && discountAmount > 0) {
        await claimVoucherQuota(tx, {
          voucherId: data.voucherId,
          userId: data.userId,
          amountCut: discountAmount,
          orderId: order.id,
        });
      }

      return {
        orderId: order.id,
        snapToken: data.snapToken,
        redirectUrl: data.redirectUrl,
      };
    });
  }
export async function getStandarLicenseService(userId: string) {
  // Cek standar order yang belum dipakai
  const availableOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: "PAID",
      standarLicenseRedeemed: false,
    },
    orderBy: { createdAt: "asc" },
  });

  if (availableOrder) {
    return {
      orderId: availableOrder.id,
      canRedeem: true,
      used: false,
      photoId: null,
      photoTitle: null,
    };
  }

  // Cek standar order yang sudah dipakai
  const usedLicense = await prisma.license.findFirst({
    where: {
      userId,
      type: "STANDAR",
    },
    include: {
      photo: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (usedLicense) {
    const usedOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "PAID",
        standarLicenseRedeemed: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      orderId: usedOrder?.id ?? null,
      canRedeem: false,
      used: true,
      photoId: usedLicense.photo?.id ?? null,
      photoTitle: usedLicense.photo?.title ?? null,
    };
  }

  return null;
}

// Redeem standar license untuk foto tertentu
// K5: atomik — klaim order via updateMany bersyarat; gagal bila count===0
// sehingga dua redeem konkuren tidak bisa memakai order yang sama.
export async function redeemStandarLicenseService(data: {
  userId: string;
  photoId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        userId: data.userId,
        status: "PAID",
        standarLicenseRedeemed: false,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!order) {
      throw new AppError(404, "NO_STANDAR_LICENSE", "Anda belum membeli paket standar");
    }

    // Klaim atomik: hanya satu pemenang bila dua request berebut order ini.
    const claim = await tx.order.updateMany({
      where: { id: order.id, standarLicenseRedeemed: false },
      data: { standarLicenseRedeemed: true },
    });

    if (claim.count === 0) {
      throw new AppError(409, "LICENSE_ALREADY_REDEEMED", "Lisensi standar sudah dipakai");
    }

    // Buat license (rollback klaim bila gagal, mis. duplikat unik)
    const license = await tx.license.create({
      data: {
        userId: data.userId,
        photoId: data.photoId,
        type: "STANDAR",
        orderId: order.id,
      },
    });

    return license;
  });
}

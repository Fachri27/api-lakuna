import { prisma } from "../../config/db.js";
import { coreApi } from "../../config/midtrans.js";
import { redisClient } from "../../config/redis.js";
import { AppError } from "../../middlewares/errorHandler.js";
import crypto from "crypto";
import { recordStandarEarnings } from "../earning/earning.service.js";
import { recordVoucherRedemption } from "../discount/discount.service.js";

// ─── VERIFY SIGNATURE ────────────────────────────────

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string,
): boolean {
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  return hash === signatureKey;
}

function isMidtransConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const maybeErr = err as {
    message?: string;
    rawHttpClientData?: { code?: string; cause?: { code?: string } };
  };

  const code = maybeErr.rawHttpClientData?.code ?? maybeErr.rawHttpClientData?.cause?.code;
  const msg = maybeErr.message ?? "";

  return code === "ENOTFOUND" || code === "ECONNRESET" || code === "ETIMEDOUT" || msg.includes("HTTP response not found");
}

// ─── MAIN WEBHOOK ────────────────────────────────────

export async function paymentWebhookService(payload: any) {
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = payload;

  // Verify signature
  const isValid = verifySignature(
    order_id,
    status_code,
    gross_amount,
    process.env.MIDTRANS_SERVER_KEY!,
    signature_key,
  );

  if (!isValid) {
    throw new AppError(400, "INVALID_SIGNATURE", "Signature tidak valid");
  }

// Cek tipe — subscription, standar purchase, atau order biasa
   const isSubscription = (order_id as string).startsWith("SUB-");
   const isStandar = (order_id as string).startsWith("STD-");

   if (isSubscription) {
     return handleSubscriptionWebhook(
       order_id,
       transaction_status,
       fraud_status,
     );
   }

   if (isStandar) {
     // Standar order - cukup update status ke PAID (license dibuat saat redeem)
     return handleStandarWebhook(order_id, transaction_status);
   }

   // Standar purchase & order biasa menggunakan flow yang sama
   return handleOrderWebhook(order_id, transaction_status, fraud_status);
}

// Handle standar order webhook
async function handleStandarWebhook(order_id: string, transaction_status: string) {
  const order = await prisma.order.findFirst({
    where: { midtransOrderId: order_id },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order standar tidak ditemukan");
  }

  if (order.status === "PAID") return { status: "ALREADY_PAID" };

  const isPaid =
    transaction_status === "settlement" || transaction_status === "capture";

  const isCancelled =
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "deny";

  if (isPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    return { status: "STANDAR_PAID" };
  }

  if (isCancelled) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return { status: "STANDAR_CANCELLED" };
  }

  return { status: "IGNORED" };
}

// ─── HANDLE ORDER BIASA ──────────────────────────────

async function handleOrderWebhook(
   order_id: string,
   transaction_status: string,
   fraud_status: string,
   skipVerification = false,
 ) {
   const order = await prisma.order.findFirst({
     where: { midtransOrderId: order_id },
     include: { items: true },
   });

  if (!order)
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  if (order.status === "PAID") return { status: "ALREADY_PAID" };

  const isPaid =
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept");

  const isCancelled =
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "deny";

  if (isPaid) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.license.createMany({
        data: order.items
          .filter((item) => item.licenseType === "STANDAR")
          .map((item) => ({
            userId: order.userId,
            photoId: item.photoId,
            orderId: order.id,
            type: item.licenseType,
            expiresAt: null,
          })),
        skipDuplicates: true,
      });

      // Generate license PDF for each photo
      for (const item of order.items) {
        const license = await tx.license.findFirst({
          where: {
            userId: order.userId,
            photoId: item.photoId,
            orderId: order.id,
          },
        });
        if (license) {
          const licensePath = `license/license-${license.id}.pdf`;
          // TODO: generate PDF
        }
      }

      // Hapus hanya cart item yang memang ditagihkan (STANDAR).
      // Item type SUBSCRIBE seharusnya diproses via flow subscription.
      const paidStandardPhotoIds = order.items
        .filter((item) => item.licenseType === "STANDAR")
        .map((item) => item.photoId);

      if (paidStandardPhotoIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            userId: order.userId,
            license: "STANDAR",
            photoId: { in: paidStandardPhotoIds },
          },
        });
      }

      // Bagi hasil: catat earning kontributor untuk item STANDAR.
      await recordStandarEarnings(tx, order.id, order.items);

      // Catat redemption voucher (idempoten) bila order pakai voucher.
      if (order.voucherId) {
        await recordVoucherRedemption(tx, {
          voucherId: order.voucherId,
          userId: order.userId,
          amountCut: order.discountAmount,
          orderId: order.id,
        });
      }
    });

    await redisClient.del(`cart:${order.userId}`);

    return { status: "ORDER_PAID" };
  }

  if (isCancelled) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return { status: "ORDER_CANCELLED" };
  }

  return { status: "IGNORED" };
}

// ─── HANDLE SUBSCRIPTION ─────────────────────────────

async function handleSubscriptionWebhook(
   order_id: string,
   transaction_status: string,
   fraud_status: string,
   skipVerification = false,
 ) {
   const subscription = await prisma.subscription.findFirst({
     where: { midtransOrderId: order_id },
   });

   if (!subscription) {
     throw new AppError(
       404,
       "SUBSCRIPTION_NOT_FOUND",
       "Subscription tidak ditemukan",
     );
   }

   if (subscription.status === "ACTIVE") return { status: "ALREADY_ACTIVE" };

   const isPaid =
     transaction_status === "settlement" ||
     (transaction_status === "capture" && fraud_status === "accept");

   const isCancelled =
     transaction_status === "cancel" ||
     transaction_status === "expire" ||
     transaction_status === "deny";

if (isPaid) {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            startedAt: new Date(),
          },
        });

        // Hanya buat license untuk cart items (SUBSCRIBE + specific photoId)
        const cartItems = await tx.cartItem.findMany({
          where: { userId: subscription.userId },
        });

       if (cartItems.length > 0) {
         await tx.license.createMany({
           data: cartItems.map((item) => ({
             userId: subscription.userId,
             photoId: item.photoId,
             type: "SUBSCRIBE" as const,
             expiresAt: subscription.expiresAt,
           })),
           skipDuplicates: true,
         });

         await tx.cartItem.deleteMany({
           where: { userId: subscription.userId },
         });
       }

       // Catat redemption voucher (idempoten) bila subscription pakai voucher.
       if (subscription.voucherId) {
         await recordVoucherRedemption(tx, {
           voucherId: subscription.voucherId,
           userId: subscription.userId,
           amountCut: subscription.discountAmount,
           subscriptionId: subscription.id,
         });
       }
     });

     await redisClient.del(`subscription:${subscription.userId}`);
     await redisClient.del(`cart:${subscription.userId}`);

     return { status: "SUBSCRIPTION_ACTIVATED" };
   }

   if (isCancelled) {
     await prisma.subscription.update({
       where: { id: subscription.id },
       data: { status: "CANCELLED" },
     });
     return { status: "SUBSCRIPTION_CANCELLED" };
   }

   return { status: "IGNORED" };
 }

// ─── GET PAYMENT STATUS ───────────────────────────────

export async function getPaymentStatusService(data: {
  userId: string;
  orderId: string;
}) {
  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      userId: data.userId,
    },
    include: {
      items: {
        include: { photo: true },
      },
    },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }

  if (!order.midtransOrderId) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Order belum memiliki midtrans order id",
    );
  }

  return {
    orderId: order.id,
    orderStatus: order.status,
    midtransOrderId: order.midtransOrderId,
    total: order.total,
    items: order.items,
  };
}

// ─── MANUAL CHECK & PROCESS ORDER STATUS ───────────────────

async function handleSubscriptionCheck(
  orderId: string,
  userId: string,
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      midtransOrderId: orderId,
      userId,
    },
  });

  if (!subscription) {
    throw new AppError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription tidak ditemukan");
  }

  let transactionStatus: string | undefined;
  let fraudStatus: string | undefined;

  try {
    const status = await (coreApi as any).transaction.status(orderId);
    console.log("[CHECK_SUBSCRIPTION_STATUS]", { orderId, status });
    transactionStatus = status.transaction_status;
    fraudStatus = status.fraud_status;
  } catch (err) {
    if (!isMidtransConnectionError(err)) {
      throw err;
    }
    // Midtrans unreachable sementara (DNS/network). Pakai status lokal agar endpoint tetap stabil.
    return { status: subscription.status === "ACTIVE" ? "PAID" : "PENDING" };
  }

  const isPaid =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");

  if (isPaid && subscription.status !== "ACTIVE") {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
        },
      });

      const cartItems = await tx.cartItem.findMany({
        where: { userId: subscription.userId },
      });

      if (cartItems.length > 0) {
        await tx.license.createMany({
          data: cartItems.map((item) => ({
            userId: subscription.userId,
            photoId: item.photoId,
            type: "SUBSCRIBE" as const,
            expiresAt: subscription.expiresAt,
          })),
          skipDuplicates: true,
        });

        await tx.cartItem.deleteMany({
          where: { userId: subscription.userId },
        });
      }

      // Catat redemption voucher (idempoten) bila subscription pakai voucher.
      if (subscription.voucherId) {
        await recordVoucherRedemption(tx, {
          voucherId: subscription.voucherId,
          userId: subscription.userId,
          amountCut: subscription.discountAmount,
          subscriptionId: subscription.id,
        });
      }
    });

    await redisClient.del(`subscription:${subscription.userId}`);
    await redisClient.del(`cart:${subscription.userId}`);

    return { status: "PAID" };
  }

  return { status: subscription.status === "ACTIVE" ? "PAID" : "PENDING" };
}

async function handleOrderCheck(
  orderId: string,
  userId: string,
) {
  const order = await prisma.order.findFirst({
    where: { midtransOrderId: orderId, userId },
    include: { items: true },
  });

  if (!order || !order.midtransOrderId) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }

  let transactionStatus: string | undefined;
  let fraudStatus: string | undefined;

  try {
    const status = await (coreApi as any).transaction.status(order.midtransOrderId);
    transactionStatus = status.transaction_status;
    fraudStatus = status.fraud_status;
  } catch (err) {
    if (!isMidtransConnectionError(err)) {
      throw err;
    }
    // Midtrans unreachable sementara (DNS/network). Kembalikan status order lokal agar frontend tidak 500.
    if (order.status === "PAID") return { status: "PAID" };
    if (order.status === "CANCELLED") return { status: "CANCELLED" };
    return { status: "PENDING" };
  }

  if (
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept")
  ) {
    if (order.status === "PAID") return { status: "PAID" };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.license.createMany({
        data: order.items
          .filter((item) => item.licenseType === "STANDAR")
          .map((item) => ({
            userId: order.userId,
            photoId: item.photoId,
            orderId: order.id,
            type: item.licenseType,
            expiresAt: null,
          })),
        skipDuplicates: true,
      });

      // Hapus hanya cart item yang memang ditagihkan (STANDAR).
      const paidStandardPhotoIds = order.items
        .filter((item) => item.licenseType === "STANDAR")
        .map((item) => item.photoId);

      if (paidStandardPhotoIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            userId: order.userId,
            license: "STANDAR",
            photoId: { in: paidStandardPhotoIds },
          },
        });
      }

      // Bagi hasil: catat earning kontributor untuk item STANDAR.
      await recordStandarEarnings(tx, order.id, order.items);

      // Catat redemption voucher (idempoten) bila order pakai voucher.
      if (order.voucherId) {
        await recordVoucherRedemption(tx, {
          voucherId: order.voucherId,
          userId: order.userId,
          amountCut: order.discountAmount,
          orderId: order.id,
        });
      }
    });

    await redisClient.del(`cart:${order.userId}`);

    return { status: "PAID" };
  }

  if (
    transactionStatus === "cancel" ||
    transactionStatus === "expire" ||
    transactionStatus === "deny"
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return { status: "CANCELLED" };
  }

  return { status: "PENDING" };
}

export async function checkAndProcessOrderStatus(data: {
   userId: string;
   orderId: string;
 }) {
   // Jika orderId kosong, langsung cek subscription user
   if (!data.orderId) {
     const subscription = await prisma.subscription.findUnique({
       where: { userId: data.userId },
     });
     
     if (!subscription) {
       throw new AppError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription tidak ditemukan");
     }

     // Cek status di Midtrans
     if (subscription.midtransOrderId) {
       return handleSubscriptionCheck(subscription.midtransOrderId, data.userId);
     }

     // Jika tidak ada midtransOrderId, return current status
     return { status: subscription.status === "ACTIVE" ? "PAID" : "PENDING" };
   }

   const isSubscription = data.orderId.startsWith("SUB-");

   if (isSubscription) {
     return handleSubscriptionCheck(data.orderId, data.userId);
   }

   // Extract numeric ID from ORDER-{id}
   const numericId = data.orderId.startsWith("ORDER-")
     ? data.orderId.replace("ORDER-", "")
     : data.orderId;

   return handleOrderCheck(numericId, data.userId);
 }

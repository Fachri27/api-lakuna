import { prisma } from "../../config/db.js";
import { coreApi } from "../../config/midtrans.js";
import { redisClient } from "../../config/redis.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { recordStandarEarnings } from "../earning/earning.service.js";
import { releaseVoucherQuota } from "../discount/discount.service.js";
import {
  recordStandarOrderVoucherOnPaid,
  recordSubscriptionVoucherOnPaid,
} from "../subscription/subscription.snap.js";
import crypto from "crypto";
import { isSupersededCharge } from "./payment.charge.js";

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

// Snap token sudah dibuat tapi pembeli belum memilih metode bayar → Core API
// membalas 404 "Transaction doesn't exist". Itu bukan error: transaksi masih menunggu.
function isMidtransTransactionNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const maybeErr = err as {
    httpStatusCode?: number | string;
    ApiResponse?: { status_code?: string };
  };

  return String(maybeErr.httpStatusCode) === "404" || maybeErr.ApiResponse?.status_code === "404";
}

// ─── SHARED WEBHOOK HELPERS ──────────────────────────

function isPaidTransaction(transaction_status: string, fraud_status?: string): boolean {
  return (
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept")
  );
}

function isCancelledTransaction(transaction_status: string): boolean {
  return (
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "deny"
  );
}

// C1: tolak webhook bila nominal tidak sama dengan total tersimpan.
function assertAmountMatches(gross_amount: string, expectedTotal: number): void {
  if (Number(gross_amount) !== expectedTotal) {
    throw new AppError(
      400,
      "AMOUNT_MISMATCH",
      `Nominal tidak sesuai (diterima ${gross_amount}, seharusnya ${expectedTotal})`,
    );
  }
}

// B6: tenor mengikuti createSubscriptionService — annual = +1 tahun, selain itu +1 bulan.
function computeSubscriptionExpiry(startedAt: Date, billing: string): Date {
  const expiresAt = new Date(startedAt);
  if (billing === "annual") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

// ─── REMOTE VERIFICATION (defense-in-depth) ────────

// Temuan pentest: verifikasi signature SHA512 hanya bergantung pada
// kerahasiaan MIDTRANS_SERVER_KEY — bila key bocor, webhook settlement
// palsu bisa mem-PAY order tanpa pembayaran nyata. Konfirmasi ulang ke
// Midtrans Core API: status yang dipakai adalah status di sisi Midtrans,
// bukan klaim body webhook.
async function fetchConfirmedStatus(
  order_id: string,
): Promise<{
  transaction_status: string;
  fraud_status: string | undefined;
  gross_amount: string;
}> {
  let remote: any;
  try {
    remote = await (coreApi as any).transaction.status(order_id);
  } catch (err) {
    if (isMidtransTransactionNotFound(err)) {
      // Transaksi belum terlihat di Core API: bisa transien (snap token
      // dibuat, metode bayar baru dipilih — Core API sesaat masih 404),
      // atau memang tidak pernah ada (webhook palsu). Gagal-tutup dengan
      // 503 agar Midtrans retry: webhook palsu tidak akan pernah lolos
      // (transaksinya tidak pernah ada), webhook sah lolos saat retry.
      throw new AppError(
        503,
        "TRANSACTION_NOT_VERIFIED_RETRY",
        "Transaksi belum terverifikasi di Midtrans, coba lagi",
      );
    }
    if (isMidtransConnectionError(err)) {
      // Midtrans sementara tak terjangkau → gagal-tutup; Midtrans retry.
      throw new AppError(
        503,
        "MIDTRANS_UNREACHABLE",
        "Tidak dapat memverifikasi status transaksi ke Midtrans, coba lagi",
      );
    }
    throw err;
  }

  const transaction_status = remote?.transaction_status;
  if (typeof transaction_status !== "string" || transaction_status.length === 0) {
    throw new AppError(
      400,
      "INVALID_REMOTE_STATUS",
      "Midtrans tidak mengembalikan status transaksi yang valid",
    );
  }

  return {
    transaction_status,
    fraud_status:
      typeof remote?.fraud_status === "string" ? remote.fraud_status : undefined,
    gross_amount: String(remote?.gross_amount ?? ""),
  };
}

// ─── MAIN WEBHOOK ────────────────────────────────────

export async function paymentWebhookService(payload: any) {
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
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

  // Tagihan lama yang diganti metode lain di halaman bayar custom: record
  // sudah menunjuk order_id baru, jadi notifikasinya (biasanya "cancel")
  // cukup diakui tanpa diproses.
  if (await isSupersededCharge(order_id)) {
    return { status: "IGNORED_SUPERSEDED" };
  }

  // Pentest fix: konfirmasi ulang ke Midtrans Core API — transaksi harus
  // benar-benar ada dan status di Midtrans yang dipakai sebagai kebenaran
  // (klaim body webhook tidak dipercaya untuk status/nominal).
  const confirmed = await fetchConfirmedStatus(order_id);

  const transaction_status = confirmed.transaction_status;
  const fraud_status = confirmed.fraud_status;
  // Nominal tetap divalidasi: harus cocok dengan yang dilaporkan Midtrans.
  if (
    confirmed.gross_amount.length > 0 &&
    Number(confirmed.gross_amount) !== Number(gross_amount)
  ) {
    throw new AppError(
      400,
      "AMOUNT_MISMATCH_REMOTE",
      `Nominal tidak sesuai dengan Midtrans (diterima ${gross_amount}, Midtrans ${confirmed.gross_amount})`,
    );
  }

  // Cek tipe — subscription, cicilan, standar purchase, atau order biasa
  const isSubscription = (order_id as string).startsWith("SUB-");
  const isInstallment = (order_id as string).startsWith("INST-");
  const isStandar = (order_id as string).startsWith("STD-");

  if (isSubscription) {
    return handleSubscriptionWebhook(
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
    );
  }

  if (isInstallment) {
    return handleInstallmentWebhook(
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
    );
  }

  if (isStandar) {
    // Standar order - cukup update status ke PAID (license dibuat saat redeem)
    return handleStandarWebhook(order_id, transaction_status, gross_amount);
  }

  // Standar purchase & order biasa menggunakan flow yang sama
  return handleOrderWebhook(order_id, transaction_status, fraud_status, gross_amount);
}

// Handle standar order webhook
async function handleStandarWebhook(
  order_id: string,
  transaction_status: string,
  gross_amount: string,
) {
  const order = await prisma.order.findFirst({
    where: { midtransOrderId: order_id },
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order standar tidak ditemukan");
  }

  assertAmountMatches(gross_amount, order.total);

  const isPaid =
    transaction_status === "settlement" || transaction_status === "capture";

  const isCancelled = isCancelledTransaction(transaction_status);

  if (isPaid) {
    // K8+K7: klaim atomik PENDING→PAID; tolak transisi dari terminal state.
    const claim = await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (claim.count !== 1) {
      const current = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (current?.status === "PAID") {
        // Catch-up best-effort: voucher mungkin belum tercatat (webhook lama).
        await recordStandarOrderVoucherOnPaid(order.id).catch((e) =>
          console.error("[VOUCHER_CATCHUP]", e),
        );
        return { status: "ALREADY_PAID" };
      }
      return { status: "IGNORED_TERMINAL" };
    }

    // K2: catat pemakaian voucher (idempoten; gagal → retry webhook).
    await recordStandarOrderVoucherOnPaid(order.id);

    return { status: "STANDAR_PAID" };
  }

  if (isCancelled) {
    // Hanya PENDING yang boleh dibatalkan; terminal state tidak disentuh.
    // Pentest tahap-2 fix #3: kembalikan kuota voucher saat order batal —
    // sebelumnya order PENDING yang tidak dibayar menguras kuota permanen.
    let released = false;
    const claim = await prisma.$transaction(async (tx) => {
      const c = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (c.count === 1) {
        released = await releaseVoucherQuota(tx, { orderId: order.id });
        return c;
      }
      return c;
    });

    if (claim.count !== 1) {
      const current = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (current?.status === "PAID") return { status: "ALREADY_PAID" };
      return { status: "ALREADY_TERMINAL" };
    }

    return { status: "STANDAR_CANCELLED", voucherQuotaReleased: released };
  }

  return { status: "IGNORED" };
}

// ─── HANDLE ORDER BIASA ──────────────────────────────

async function handleOrderWebhook(
  order_id: string,
  transaction_status: string,
  fraud_status: string | undefined,
  gross_amount: string,
) {
  const order = await prisma.order.findFirst({
    where: { midtransOrderId: order_id },
    include: { items: true },
  });

  if (!order)
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");

  assertAmountMatches(gross_amount, order.total);

  const isPaid = isPaidTransaction(transaction_status, fraud_status);

  const isCancelled = isCancelledTransaction(transaction_status);

  if (isPaid) {
    const result = await prisma.$transaction(async (tx) => {
      // K8+K7: klaim atomik PENDING→PAID; tolak transisi dari CANCELLED/EXPIRED.
      const claim = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });

      if (claim.count !== 1) {
        const current = await tx.order.findUnique({
          where: { id: order.id },
          select: { status: true },
        });
        if (current?.status === "PAID") return { status: "ALREADY_PAID" };
        return { status: "IGNORED_TERMINAL" };
      }

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

      // K3: catat earning kontributor dalam transaksi webhook yang sama.
      await recordStandarEarnings(tx, order.id, order.items);

      return { status: "ORDER_PAID" };
    });

    if (result.status === "ORDER_PAID") {
      await redisClient.del(`cart:${order.userId}`);
    }

    return result;
  }

  if (isCancelled) {
    // Hanya PENDING yang boleh dibatalkan; terminal state tidak disentuh.
    // Pentest tahap-2 fix #3: kembalikan kuota voucher saat order batal —
    // sebelumnya order PENDING yang tidak dibayar menguras kuota permanen.
    let released = false;
    const claim = await prisma.$transaction(async (tx) => {
      const c = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (c.count === 1) {
        released = await releaseVoucherQuota(tx, { orderId: order.id });
      }
      return c;
    });

    if (claim.count !== 1) {
      const current = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (current?.status === "PAID") return { status: "ALREADY_PAID" };
      return { status: "ALREADY_TERMINAL" };
    }

    return { status: "ORDER_CANCELLED", voucherQuotaReleased: released };
  }

  return { status: "IGNORED" };
}

// ─── HANDLE CICILAN (INST-*) ─────────────────────────

async function handleInstallmentWebhook(
  order_id: string,
  transaction_status: string,
  fraud_status: string | undefined,
  gross_amount: string,
) {
  // Semua cicilan yang dilunasi bersama berbagi satu midtransOrderId
  // (lihat payRemainingBalanceController: updateMany midtransOrderId).
  const installments = await prisma.billingInstallment.findMany({
    where: { midtransOrderId: order_id },
  });

  if (installments.length === 0) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Cicilan tidak ditemukan");
  }

  // C1: nominal harus sama dengan jumlah cicilan terkait.
  const expectedTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
  assertAmountMatches(gross_amount, expectedTotal);

  const isPaid = isPaidTransaction(transaction_status, fraud_status);
  const isCancelled = isCancelledTransaction(transaction_status);

  if (isPaid) {
    // Atomik + idempoten: hanya klaim baris yang masih PENDING.
    const claim = await prisma.billingInstallment.updateMany({
      where: { midtransOrderId: order_id, status: "PENDING" },
      data: { status: "PAID" },
    });

    if (claim.count === 0) return { status: "ALREADY_PAID" };

    const first = installments[0];
    if (first) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: first.subscriptionId },
        select: { userId: true },
      });
      if (subscription) {
        await redisClient.del(`subscription:${subscription.userId}`);
      }
    }

    return { status: "INSTALLMENT_PAID", count: claim.count };
  }

  // Pembayaran cicilan yang dibatalkan/expire: biarkan tetap PENDING
  // agar user bisa mencoba lagi; jangan overwrite status secara buta.
  if (isCancelled) {
    return { status: "IGNORED" };
  }

  return { status: "IGNORED" };
}

// ─── HANDLE SUBSCRIPTION ─────────────────────────────

async function handleSubscriptionWebhook(
  order_id: string,
  transaction_status: string,
  fraud_status: string | undefined,
  gross_amount: string,
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

  // Yang ditagih = harga − diskon (sama dengan gross_amount Snap/Core API).
  // Dulu dibandingkan dengan harga penuh → langganan ber-voucher selalu
  // ditolak AMOUNT_MISMATCH.
  assertAmountMatches(gross_amount, Math.max(0, subscription.price - (subscription.discountAmount ?? 0)));

  const isPaid = isPaidTransaction(transaction_status, fraud_status);

  const isCancelled = isCancelledTransaction(transaction_status);

  if (isPaid) {
    const result = await prisma.$transaction(async (tx) => {
      // B6: hitung ulang expiresAt dari startedAt + tenor di dalam tx yang sama.
      const startedAt = new Date();
      const expiresAt = computeSubscriptionExpiry(
        startedAt,
        subscription.billing,
      );

      // K8+K7: klaim atomik PENDING→ACTIVE; tolak transisi dari CANCELLED/EXPIRED.
      const claim = await tx.subscription.updateMany({
        where: { id: subscription.id, status: "PENDING" },
        data: {
          status: "ACTIVE",
          startedAt,
          expiresAt,
        },
      });

      if (claim.count !== 1) {
        const current = await tx.subscription.findUnique({
          where: { id: subscription.id },
          select: { status: true },
        });
        if (current?.status === "ACTIVE") return { status: "ALREADY_ACTIVE" };
        return { status: "IGNORED_TERMINAL" };
      }

      // B2: hanya proses cart items SUBSCRIBE (abaikan STANDAR).
      const cartItems = await tx.cartItem.findMany({
        where: { userId: subscription.userId, license: "SUBSCRIBE" },
      });

      if (cartItems.length > 0) {
        await tx.license.createMany({
          data: cartItems.map((item) => ({
            userId: subscription.userId,
            photoId: item.photoId,
            type: "SUBSCRIBE" as const,
            expiresAt,
          })),
          skipDuplicates: true,
        });

        await tx.cartItem.deleteMany({
          where: { userId: subscription.userId, license: "SUBSCRIBE" },
        });
      }

      return { status: "SUBSCRIPTION_ACTIVATED" };
    });

    if (result.status === "SUBSCRIPTION_ACTIVATED") {
      await redisClient.del(`subscription:${subscription.userId}`);
      await redisClient.del(`cart:${subscription.userId}`);
      // K2: catat pemakaian voucher (idempoten; gagal → retry webhook).
      await recordSubscriptionVoucherOnPaid(subscription.id);
    } else if (result.status === "ALREADY_ACTIVE") {
      // Catch-up best-effort untuk aktivasi lama yang belum tercatat.
      await recordSubscriptionVoucherOnPaid(subscription.id).catch((e) =>
        console.error("[VOUCHER_CATCHUP]", e),
      );
    }

    return result;
  }

  if (isCancelled) {
    // Hanya PENDING yang boleh dibatalkan; terminal state tidak disentuh.
    // Pentest tahap-2 fix #3: kembalikan kuota voucher saat subscription
    // batal/expire — redemption dicatat saat order gratis; kuota tidak
    // boleh terkuras oleh subscription yang tidak pernah aktif.
    let released = false;
    const claim = await prisma.$transaction(async (tx) => {
      const c = await tx.subscription.updateMany({
        where: { id: subscription.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (c.count === 1) {
        released = await releaseVoucherQuota(tx, { subscriptionId: subscription.id });
      }
      return c;
    });

    if (claim.count !== 1) {
      const current = await prisma.subscription.findUnique({
        where: { id: subscription.id },
        select: { status: true },
      });
      if (current?.status === "ACTIVE") return { status: "ALREADY_ACTIVE" };
      return { status: "ALREADY_TERMINAL" };
    }

    return { status: "SUBSCRIPTION_CANCELLED", voucherQuotaReleased: released };
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
  // startsWith: halaman bayar custom bisa mengganti order_id jadi
  // <base>-2, <base>-3 saat pembeli berganti metode.
  const subscription = await prisma.subscription.findFirst({
    where: {
      midtransOrderId: { startsWith: orderId },
      userId,
    },
  });

  if (!subscription || !subscription.midtransOrderId) {
    throw new AppError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription tidak ditemukan");
  }
  orderId = subscription.midtransOrderId;

  let transactionStatus: string | undefined;
  let fraudStatus: string | undefined;

  try {
    const status = await (coreApi as any).transaction.status(orderId);
    console.log("[CHECK_SUBSCRIPTION_STATUS]", { orderId, status });
    transactionStatus = status.transaction_status;
    fraudStatus = status.fraud_status;
  } catch (err) {
    if (!isMidtransConnectionError(err) && !isMidtransTransactionNotFound(err)) {
      throw err;
    }
    // Midtrans unreachable sementara (DNS/network) atau transaksi belum dibuat (metode bayar
    // belum dipilih). Pakai status lokal agar endpoint tetap stabil.
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
    });

    await redisClient.del(`subscription:${subscription.userId}`);
    await redisClient.del(`cart:${subscription.userId}`);

    // K2: catat pemakaian voucher (idempoten).
    await recordSubscriptionVoucherOnPaid(subscription.id).catch((e) =>
      console.error("[VOUCHER_CATCHUP]", e),
    );

    return { status: "PAID" };
  }

  return { status: subscription.status === "ACTIVE" ? "PAID" : "PENDING" };
}

async function handleOrderCheck(
  orderId: string,
  userId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
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
    if (!isMidtransConnectionError(err) && !isMidtransTransactionNotFound(err)) {
      throw err;
    }
    // Midtrans unreachable sementara (DNS/network) atau transaksi belum dibuat (metode bayar
    // belum dipilih). Kembalikan status order lokal agar frontend tidak 500.
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
    });

    await redisClient.del(`cart:${order.userId}`);

    return { status: "PAID" };
  }

  if (
    transactionStatus === "cancel" ||
    transactionStatus === "expire" ||
    transactionStatus === "deny"
  ) {
    // Pentest tahap-2 fix #3: kembalikan kuota voucher saat order
    // batal/expire. Guard PENDING (K7): order PAID tidak boleh
    // di-CANCEL oleh polling.
    let released = false;
    await prisma.$transaction(async (tx) => {
      const c = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (c.count === 1) {
        released = await releaseVoucherQuota(tx, { orderId: order.id });
      }
    });
    return { status: "CANCELLED", voucherQuotaReleased: released };
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

   // STD- (lisensi Standar) tersimpan sebagai Order dengan midtransOrderId
   // STD-…; dulu diperlakukan sebagai id order → selalu 404.
   if (data.orderId.startsWith("STD-")) {
     const std = await prisma.order.findFirst({
       where: { userId: data.userId, midtransOrderId: { startsWith: data.orderId } },
       select: { id: true },
     });
     if (!std) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
     return handleOrderCheck(std.id, data.userId);
   }

   // Extract numeric ID from ORDER-{id}
   const numericId = data.orderId.startsWith("ORDER-")
     ? data.orderId.replace("ORDER-", "")
     : data.orderId;

   return handleOrderCheck(numericId, data.userId);
}

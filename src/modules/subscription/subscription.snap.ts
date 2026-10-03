import { prisma } from "../../config/db.js";
import { snap } from "../../config/midtrans.js";
import { randomUUID } from "crypto";
import { AppError } from "../../middlewares/errorHandler.js";
import {
  computeSubscriptionDiscount,
  validateVoucher,
  computeDiscountAmount,
  recordVoucherRedemption,
} from "../discount/discount.service.js";

export async function createSubscriptionSnap(data: {
  userId: string;
  planId: string;
  billing: "annual" | "monthly";
  payOption: "monthly" | "upfront";
  voucherCode?: string | undefined;
}) {
  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
  });

  if (!plan) throw new AppError(404, "NOT_FOUND", "Plan tidak ditemukan");
  if (!plan.isActive) throw new AppError(400, "BAD_REQUEST", "Plan tidak tersedia");

  const isAnnualUpfront = data.billing === "annual" && data.payOption === "upfront";
  const price = isAnnualUpfront ? plan.priceAnnual : plan.priceMonthly;

  const user = await prisma.user.findUnique({
    where:  { id: data.userId },
    select: { email: true, username: true },
  });

  if (!user) throw new AppError(404, "NOT_FOUND", "User tidak ditemukan");

  // ── diskon: hanya untuk pembayaran upfront (bukan cicilan tahunan) ──
  let discountAmount = 0;
  let voucherId: string | undefined;
  let voucherCode: string | undefined;
  if (data.payOption === "upfront") {
    const discount = await computeSubscriptionDiscount({
      userId: data.userId,
      planId: data.planId,
      planPrice: price,
      voucherCode: data.voucherCode,
    });
    discountAmount = discount.amount;
    voucherId = discount.voucherId;
    voucherCode = discount.voucherCode;
  }
  const grossAmount = Math.max(0, price - discountAmount);

  // B7: suffix acak agar order_id unik (Midtrans menolak order_id duplikat).
  const orderId = `SUB-${Date.now()}-${randomUUID().slice(0, 8)}`; // Keep under 50 chars - Midtrans limit

  // B4: order gratis (diskon 100%) — jangan panggil Midtrans (menolak
  // gross_amount 0). Service menandai Subscription langsung ACTIVE tanpa Snap.
  if (grossAmount === 0) {
    return {
      snapToken: null as string | null,
      redirectUrl: undefined as string | undefined,
      orderId,
      price,
      plan,
      discountAmount,
      voucherId,
      voucherCode,
      grossAmount,
      isFree: true as const,
    };
  }

  const itemDetails: Array<{ id: string; name: string; price: number; quantity: number }> = [
    {
      id:       plan.id,
      name:     `Subscription ${plan.quota} foto/bulan`,
      price,
      quantity: 1,
    },
  ];
  if (discountAmount > 0) {
    itemDetails.push({
      id: "DISCOUNT",
      name: voucherCode ? `Voucher ${voucherCode}`.trim() : "Event diskon",
      price: -discountAmount,
      quantity: 1,
    });
  }

  const transaction = await (snap as any).createTransaction({
    transaction_details: {
      order_id:     orderId,
      gross_amount: grossAmount,
    },
    customer_details: {
      email:      user.email,
      first_name: user.username,
    },
    item_details: itemDetails,
    callbacks: {
      finish: `${process.env.FRONTEND_URL}/payment/finish`,
      unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
      error: `${process.env.FRONTEND_URL}/payment/error`,
    },
  });

return {
     snapToken: transaction.token,
     redirectUrl: transaction.redirect_url,
     orderId,
     price,
     plan,
     discountAmount,
     voucherId,
     voucherCode,
   };
 }

 export async function createSubscriptionInstallmentSnap(data: {
  userId: string;
  orderId: string;
  amount: number;
  description: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { email: true, username: true },
  });

  if (!user) throw new AppError(404, "NOT_FOUND", "User tidak ditemukan");

  const transaction = await (snap as any).createTransaction({
    transaction_details: {
      order_id: data.orderId,
      gross_amount: data.amount,
    },
    customer_details: {
      email: user.email,
      first_name: user.username,
    },
    item_details: [
      {
        id: "installment",
        name: data.description,
        price: data.amount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${process.env.FRONTEND_URL}/payment/finish`,
      unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
      error: `${process.env.FRONTEND_URL}/payment/error`,
    },
  });

  return {
    snapToken: transaction.token,
    redirectUrl: transaction.redirect_url,
    orderId: data.orderId,
    amount: data.amount,
  };
}

// Standar plan - one time purchase
 export async function createStandarSnap(data: { userId: string; voucherCode?: string | undefined }) {
   const user = await prisma.user.findUnique({
     where: { id: data.userId },
     select: { email: true, username: true },
   });

    if (!user) throw new AppError(404, "NOT_FOUND", "User tidak ditemukan");

    // B7: suffix acak agar order_id unik (Midtrans menolak order_id duplikat).
    const orderId = `STD-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const priceSetting = await prisma.setting.findUnique({
     where: { key: "standar_plan_price" },
   });
   const price = priceSetting ? parseInt(priceSetting.value, 10) : 500000;

   // ── diskon voucher scope ORDER (standar plan = one-time order) ──
   let discountAmount = 0;
   let voucherId: string | undefined;
   let voucherCode: string | undefined;
   if (data.voucherCode) {
     const v = await validateVoucher({
       code: data.voucherCode,
       scope: "ORDER",
       userId: data.userId,
       amount: price,
     });
     if (v.valid && v.voucher && v.discountAmount > 0) {
       discountAmount = v.discountAmount;
       voucherId = v.voucher.id;
       voucherCode = v.voucher.code;
     }
   }
    const grossAmount = Math.max(0, price - discountAmount);

    // B4: order gratis (diskon 100%) — jangan panggil Midtrans (menolak
    // gross_amount 0). Service menandai Order langsung PAID + redeemable.
    if (grossAmount === 0) {
      return {
        snapToken: null as string | null,
        redirectUrl: undefined as string | undefined,
        orderId,
        price,
        discountAmount,
        voucherId,
        voucherCode,
        grossAmount,
        isFree: true as const,
      };
    }

    const itemDetails: Array<{ id: string; name: string; price: number; quantity: number }> = [
      {
        id: "standar-plan",
       name: "Lakuna Foto Standar Plan",
       price,
       quantity: 1,
     },
   ];
   if (discountAmount > 0) {
     itemDetails.push({
       id: "DISCOUNT",
       name: voucherCode ? `Voucher ${voucherCode}`.trim() : "Diskon",
       price: -discountAmount,
       quantity: 1,
     });
   }

   const transaction = await (snap as any).createTransaction({
     transaction_details: {
       order_id: orderId,
       gross_amount: grossAmount,
     },
     customer_details: {
       email: user.email,
       first_name: user.username,
     },
     item_details: itemDetails,
     callbacks: {
       finish: `${process.env.FRONTEND_URL}/payment/finish`,
       unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
       error: `${process.env.FRONTEND_URL}/payment/error`,
     },
   });

    return {
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      price,
      discountAmount,
      voucherId,
      voucherCode,
    };
  }

// ── pencatatan voucher saat settlement sukses (dipanggil dari webhook) ──
// Snap create-time (createSubscriptionSnap / createStandarSnap) TIDAK bisa
// mencatat redemption: baris Subscription / Order (target FK redemption)
// belum ada saat token Midtrans dibuat. Fungsi di bawah ini adalah titik
// sukses pemakaian — panggil dari webhook/polling setelah status PAID/ACTIVE,
// bersamaan dengan increment usedCount (di dalam recordVoucherRedemption,
// satu transaksi). Idempoten: cek existing (voucherId+subscriptionId/orderId)
// di dalam transaksi sebelum create, lewati bila sudah ada.
export async function recordSubscriptionVoucherOnPaid(
  subscriptionId: string,
): Promise<{ status: "RECORDED" | "ALREADY_RECORDED" | "NO_VOUCHER" }> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!sub) return { status: "NO_VOUCHER" };
  const voucherId = sub.voucherId;
  const amountCut = sub.discountAmount ?? 0;
  if (!voucherId || amountCut <= 0) return { status: "NO_VOUCHER" };

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.voucherRedemption.findFirst({
      where: { voucherId, subscriptionId: sub.id },
    });
    if (existing) return "ALREADY_RECORDED" as const;
    await recordVoucherRedemption(tx, {
      voucherId,
      userId: sub.userId,
      amountCut,
      subscriptionId: sub.id,
    });
    return "RECORDED" as const;
  });
  return { status: result };
}

export async function recordStandarOrderVoucherOnPaid(
  orderId: string,
): Promise<{ status: "RECORDED" | "ALREADY_RECORDED" | "NO_VOUCHER" }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) return { status: "NO_VOUCHER" };
  const voucherId = order.voucherId;
  const amountCut = order.discountAmount ?? 0;
  if (!voucherId || amountCut <= 0) return { status: "NO_VOUCHER" };

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.voucherRedemption.findFirst({
      where: { voucherId, orderId: order.id },
    });
    if (existing) return "ALREADY_RECORDED" as const;
    await recordVoucherRedemption(tx, {
      voucherId,
      userId: order.userId,
      amountCut,
      orderId: order.id,
    });
    return "RECORDED" as const;
  });
  return { status: result };
}
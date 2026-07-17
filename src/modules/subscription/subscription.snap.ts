import { prisma } from "../../config/db.js";
import { snap } from "../../config/midtrans.js";
import { AppError } from "../../middlewares/errorHandler.js";
import {
  computeSubscriptionDiscount,
  validateVoucher,
  computeDiscountAmount,
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

  const orderId = `SUB-${Date.now()}`; // Keep under 50 chars - Midtrans limit

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

   const orderId = `STD-${Date.now()}`;
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
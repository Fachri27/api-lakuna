import { NextFunction, Request, Response } from "express";
import { 
  getSubscriptionService, 
  createSubscriptionService, 
  cancelSubscriptionService,
  refreshSubscriptionCache,
  invalidateSubscriptionCache,
  createStandarPurchaseService,
  getStandarLicenseService,
  redeemStandarLicenseService,
  getInstallmentsService,
  payRemainingBalanceService,
  getAdminSubscriptionsService,
  expireSubscriptionByAdminService,
} from "./subscription.service.js";
import { createSubscriptionSnap, createStandarSnap, createSubscriptionInstallmentSnap } from "./subscription.snap.js";
import { getAuthUser } from "../../utils/auth.js";
import { prisma } from "../../config/db.js";

export async function getSubscriptionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const bypassCache = req.query.refresh === 'true' || req.query.bypassCache === 'true';
    
    const subscription = await getSubscriptionService(
      getAuthUser(req).userId, 
      bypassCache
    );

    return res.json({
      success: true,
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
}

export async function createSubscriptionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { planId, billing, payOption, voucherCode } = req.body;
    const userId = getAuthUser(req).userId;

    const { snapToken, redirectUrl, orderId, price, plan, discountAmount, voucherId } = await createSubscriptionSnap({
      userId,
      planId,
      billing,
      payOption,
      voucherCode,
    });

    const data = await createSubscriptionService({
      userId,
      planId,
      billing,
      payOption,
      price,
      quota:     plan.quota,
      orderId,
      snapToken,
      redirectUrl,
      discountAmount,
      voucherId,
    });

    // payOrderId = order_id Midtrans (SUB-…/STD-…) untuk halaman bayar custom
    // /payment/pay/<payOrderId>. `data.orderId` (Standar) adalah UUID order.
    return res.status(201).json({ success: true, data: data ? { ...data, payOrderId: orderId } : data });
  } catch (err) {
    next(err);
  }
}

export async function getInstallmentsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getInstallmentsService(getAuthUser(req).userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function payRemainingBalanceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthUser(req).userId;

    const { totalRemaining, orderId, installmentCount } = await payRemainingBalanceService(userId);

    const { snapToken, redirectUrl } = await createSubscriptionInstallmentSnap({
      userId,
      orderId,
      amount: totalRemaining,
      description: `Pelunasan ${installmentCount} cicilan subscription`,
    });

    // Store snap info in all pending installments
    await prisma.billingInstallment.updateMany({
      where: {
        subscription: { userId },
        status: "PENDING",
      },
      data: {
        midtransOrderId: orderId,
        snapToken,
      },
    });

    return res.json({
      success: true,
      data: { snapToken, redirectUrl, orderId, totalRemaining, installmentCount },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminSubscriptionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAdminSubscriptionsService();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function expireSubscriptionByAdminController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId as string;
    const data = await expireSubscriptionByAdminService(userId);
    return res.json({
      success: true,
      message: "Subscription berhasil di-expire",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscriptionController(
   req: Request,
   res: Response,
   next: NextFunction,
 ) {
   try {
     const result = await cancelSubscriptionService(getAuthUser(req).userId);

     return res.json({
       success: true,
       message: "Subscription berhasil dibatalkan",
       data: result,
     });
   } catch (err) {
     next(err);
   }
 }

export async function refreshSubscriptionController(
   req: Request,
   res: Response,
   next: NextFunction,
 ) {
   try {
     // Refresh cache dan ambil data fresh
     const subscription = await refreshSubscriptionCache(getAuthUser(req).userId);
     
     return res.json({
       success: true,
       data: subscription,
       message: "Subscription cache refreshed"
     });
   } catch (err) {
     next(err);
   }
 }

export async function createStandarPurchaseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthUser(req).userId;
    const voucherCode = req.body?.voucherCode as string | undefined;

    const { snapToken, redirectUrl, orderId, price, discountAmount, voucherId } = await createStandarSnap({
      userId,
      voucherCode,
    });

    const data = await createStandarPurchaseService({
      userId,
      orderId,
      snapToken,
      redirectUrl,
      price,
      discountAmount,
      voucherId,
    });

    // payOrderId = order_id Midtrans (SUB-…/STD-…) untuk halaman bayar custom
    // /payment/pay/<payOrderId>. `data.orderId` (Standar) adalah UUID order.
    return res.status(201).json({ success: true, data: data ? { ...data, payOrderId: orderId } : data });
  } catch (err) {
    next(err);
  }
}

export async function getStandarLicenseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getStandarLicenseService(getAuthUser(req).userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function redeemStandarLicenseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { photoId } = req.body;
    const data = await redeemStandarLicenseService({
      userId: getAuthUser(req).userId,
      photoId,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
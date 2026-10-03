import type { Request, Response, NextFunction } from "express";
import {
  paymentWebhookService,
  getPaymentStatusService,
  checkAndProcessOrderStatus,
} from "./payment.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getAuthUser } from "../../utils/auth.js";
import { getPayment, chargePayment, type PayMethod } from "./payment.charge.js";

const UNKNOWN_ORDER_CODES = new Set(["ORDER_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND"]);

export async function webhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("[WEBHOOK_RECEIVED]", {
      order_id: req.body?.order_id,
      transaction_status: req.body?.transaction_status,
      gross_amount: req.body?.gross_amount,
    });
    const result = await paymentWebhookService(req.body);
    console.log("[WEBHOOK_SUCCESS]", {
      order_id: req.body?.order_id,
      result,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[WEBHOOK_ERROR]", {
      order_id: req.body?.order_id,
      transaction_status: req.body?.transaction_status,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    // C2: 400 untuk signature tak valid / order tak dikenal / nominal tak
    // sesuai; 200 hanya untuk event valid yang diproses/diabaikan.
    // Order tak dikenal dilempar sebagai 404 dari service, tapi bagi
    // Midtrans itu request buruk — balas 400 agar tidak di-retry sia-sia.
    if (err instanceof AppError) {
      const status =
        err.statusCode === 404 && UNKNOWN_ORDER_CODES.has(err.code)
          ? 400
          : err.statusCode;
      return res
        .status(status)
        .json({ success: false, error: { code: err.code, message: err.message } });
    }
    return next(err);
  }
}

export async function getPaymentStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const orderId = req.params.orderId;
    if (typeof orderId !== "string") {
      return res.status(400).json({ success: false, error: "Invalid orderId" });
    }
    const data = await getPaymentStatusService({
      userId: getAuthUser(req).userId,
      orderId,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checkOrderStatusController(
   req: Request,
   res: Response,
   next: NextFunction,
 ) {
   try {
     const orderId = req.params.orderId;
     if (typeof orderId !== "string") {
       return res.status(400).json({ success: false, error: "Invalid orderId" });
     }
     const data = await checkAndProcessOrderStatus({
       userId: getAuthUser(req).userId,
       orderId,
     });
     return res.status(200).json({ success: true, data });
   } catch (err) {
     next(err);
   }
 }
export async function checkSubscriptionPaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthUser(req).userId;
    const data = await checkAndProcessOrderStatus({
      userId,
      orderId: "", // Will check directly from subscription
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
// ─── Halaman bayar custom (Core API) ─────────────────────────
export async function getPaymentPageController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPayment(String(req.params.orderId), getAuthUser(req).userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function chargePaymentController(req: Request, res: Response, next: NextFunction) {
  try {
    const { method, cardToken } = (req.body ?? {}) as { method?: string; cardToken?: string };
    const data = await chargePayment(
      String(req.params.orderId),
      getAuthUser(req).userId,
      String(method) as PayMethod,
      typeof cardToken === "string" ? cardToken : undefined,
    );
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

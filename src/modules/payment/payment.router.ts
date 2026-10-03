import { Router } from "express";
import {
  webhookController,
  getPaymentStatusController,
  checkOrderStatusController,
  checkSubscriptionPaymentController,
  getPaymentPageController,
  chargePaymentController,
} from "./payment.controller.js";
import { xenditCallbackController } from "./payment.xendit.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { webhookRateLimiter } from "../../middlewares/rateLimit.js";

const routerPayment = Router();

// Tidak pakai authenticate — Midtrans tidak kirim JWT.
// Pentest fix: rate limiter khusus webhook (60x/menit) — verifikasi
// signature/token tetap memakan komputasi untuk tiap request.
routerPayment.post("/webhook", webhookRateLimiter, webhookController);

// Tidak pakai authenticate — Xendit tidak kirim JWT (verifikasi via x-callback-token)
routerPayment.post(
  "/xendit-callback",
  webhookRateLimiter,
  xenditCallbackController,
);

// Butuh login
routerPayment.get("/status/:orderId", authMiddleware, getPaymentStatusController);
routerPayment.post("/check/:orderId", authMiddleware, checkOrderStatusController);
routerPayment.post("/check-subscription", authMiddleware, checkSubscriptionPaymentController);

// Halaman bayar custom (Midtrans Core API) — lihat payment.charge.ts.
routerPayment.get("/pay/:orderId", authMiddleware, getPaymentPageController);
routerPayment.post("/pay/:orderId/charge", authMiddleware, chargePaymentController);

export default routerPayment;
import { Router } from "express";
import { webhookController, getPaymentStatusController, checkOrderStatusController, checkSubscriptionPaymentController, } from "./payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
const routerPayment = Router();
// Tidak pakai authenticate — Midtrans tidak kirim JWT
routerPayment.post("/webhook", webhookController);
// Butuh login
routerPayment.get("/status/:orderId", authMiddleware, getPaymentStatusController);
routerPayment.post("/check/:orderId", authMiddleware, checkOrderStatusController);
routerPayment.post("/check-subscription", authMiddleware, checkSubscriptionPaymentController);
export default routerPayment;
//# sourceMappingURL=payment.router.js.map
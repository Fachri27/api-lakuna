import { paymentWebhookService, getPaymentStatusService, checkAndProcessOrderStatus, } from "./payment.service.js";
import { getAuthUser } from "../../utils/auth.js";
export async function webhookController(req, res, next) {
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
    }
    catch (err) {
        console.error("[WEBHOOK_ERROR]", {
            order_id: req.body?.order_id,
            transaction_status: req.body?.transaction_status,
            error: err instanceof Error ? err.message : "Unknown error",
        });
        return res.status(200).json({ success: false });
    }
}
export async function getPaymentStatusController(req, res, next) {
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
    }
    catch (err) {
        next(err);
    }
}
export async function checkOrderStatusController(req, res, next) {
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
    }
    catch (err) {
        next(err);
    }
}
export async function checkSubscriptionPaymentController(req, res, next) {
    try {
        const userId = getAuthUser(req).userId;
        const data = await checkAndProcessOrderStatus({
            userId,
            orderId: "", // Will check directly from subscription
        });
        return res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=payment.controller.js.map
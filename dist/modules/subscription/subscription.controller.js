import { getSubscriptionService, createSubscriptionService, cancelSubscriptionService, refreshSubscriptionCache, createStandarPurchaseService, getStandarLicenseService, redeemStandarLicenseService, } from "./subscription.service.js";
import { createSubscriptionSnap, createStandarSnap } from "./subscription.snap.js";
import { getAuthUser } from "../../utils/auth.js";
export async function getSubscriptionController(req, res, next) {
    try {
        // Support query parameter untuk bypass cache: ?refresh=true atau ?bypassCache=true
        const bypassCache = req.query.refresh === 'true' || req.query.bypassCache === 'true';
        const subscription = await getSubscriptionService(getAuthUser(req).userId, bypassCache);
        return res.json({
            success: true,
            data: subscription,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function createSubscriptionController(req, res, next) {
    try {
        const { planId, billing, payOption } = req.body;
        const userId = getAuthUser(req).userId;
        const { snapToken, redirectUrl, orderId, price, plan } = await createSubscriptionSnap({
            userId,
            planId,
            billing,
        });
        const data = await createSubscriptionService({
            userId,
            planId,
            billing,
            payOption,
            price,
            quota: plan.quota,
            orderId,
            snapToken,
            redirectUrl,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
export async function cancelSubscriptionController(req, res, next) {
    try {
        const result = await cancelSubscriptionService(getAuthUser(req).userId);
        return res.json({
            success: true,
            message: "Subscription berhasil dibatalkan",
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function refreshSubscriptionController(req, res, next) {
    try {
        // Refresh cache dan ambil data fresh
        const subscription = await refreshSubscriptionCache(getAuthUser(req).userId);
        return res.json({
            success: true,
            data: subscription,
            message: "Subscription cache refreshed"
        });
    }
    catch (err) {
        next(err);
    }
}
export async function createStandarPurchaseController(req, res, next) {
    try {
        const userId = getAuthUser(req).userId;
        const { snapToken, redirectUrl, orderId, price } = await createStandarSnap({
            userId,
        });
        const data = await createStandarPurchaseService({
            userId,
            orderId,
            snapToken,
            redirectUrl,
            price,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
export async function getStandarLicenseController(req, res, next) {
    try {
        const data = await getStandarLicenseService(getAuthUser(req).userId);
        return res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
export async function redeemStandarLicenseController(req, res, next) {
    try {
        const { photoId } = req.body;
        const data = await redeemStandarLicenseService({
            userId: getAuthUser(req).userId,
            photoId,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=subscription.controller.js.map
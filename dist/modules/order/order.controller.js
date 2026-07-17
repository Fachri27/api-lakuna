import { createOrderService, getOrdersService, getOrdersAdminService } from "./order.service.js";
import { getAuthUser } from "../../utils/auth.js";
import { AppError } from "../../middlewares/errorHandler.js";
export async function createOrderController(req, res, next) {
    try {
        const order = await createOrderService({
            userId: getAuthUser(req).userId,
        });
        return res.status(200).json({
            success: true,
            data: order,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function getOrdersController(req, res, next) {
    try {
        const orders = await getOrdersService(getAuthUser(req).userId);
        return res.status(200).json({
            success: true,
            data: orders,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function getOrdersAdminController(req, res, next) {
    try {
        const user = getAuthUser(req);
        if (user.role !== "ADMIN") {
            throw new AppError(403, "FORBIDDEN", "Akses ditolak");
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const orders = await getOrdersAdminService(page, limit);
        return res.status(200).json({
            success: true,
            data: orders.data,
            meta: orders.meta,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=order.controller.js.map
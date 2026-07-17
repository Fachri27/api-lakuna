import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { createOrderController, getOrdersController, getOrdersAdminController, } from "./order.controller.js";
const routerOrder = Router();
routerOrder.get("/", authMiddleware, getOrdersController);
routerOrder.get("/admin", authMiddleware, getOrdersAdminController);
routerOrder.post("/", authMiddleware, createOrderController);
export default routerOrder;
//# sourceMappingURL=order.router.js.map
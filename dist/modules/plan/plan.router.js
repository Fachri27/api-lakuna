import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { createPlanController, getAllPlansController, updatePlanController, deletePlanController, } from "./plan.controller.js";
const routerPlan = Router();
// Public - user bisa lihat plan
routerPlan.get("/", getAllPlansController);
// Admin only
routerPlan.post("/", authMiddleware, roleMiddleware("ADMIN"), createPlanController);
routerPlan.patch("/:id", authMiddleware, roleMiddleware("ADMIN"), updatePlanController);
routerPlan.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deletePlanController);
export default routerPlan;
//# sourceMappingURL=plan.router.js.map
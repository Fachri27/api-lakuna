import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { validate } from "../../middlewares/validate.js";
import { CreatePlanSchema, UpdatePlanSchema } from "./plan.schema.js";
import {
  createPlanController,
  getAllPlansController,
  updatePlanController,
  deletePlanController,
} from "./plan.controller.js";

const routerPlan = Router();

// Public - user bisa lihat plan
routerPlan.get("/", getAllPlansController);

// Admin only
routerPlan.post("/", authMiddleware, roleMiddleware("ADMIN"), validate(CreatePlanSchema), createPlanController);
routerPlan.patch("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(UpdatePlanSchema), updatePlanController);
routerPlan.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deletePlanController);

export default routerPlan;
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import {
  getMyEarningsController,
  getMySummaryController,
  listAllEarningsController,
} from "./earning.controller.js";

const router = Router();

// Contributor + Admin: own earnings
router.get(
  "/mine",
  authMiddleware,
  roleMiddleware("ADMIN", "CONTRIBUTOR"),
  getMyEarningsController,
);
router.get(
  "/mine/summary",
  authMiddleware,
  roleMiddleware("ADMIN", "CONTRIBUTOR"),
  getMySummaryController,
);

// Admin only: all earnings
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  listAllEarningsController,
);

export default router;
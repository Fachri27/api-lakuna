import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import {
  createPayoutController,
  listPayoutsController,
  listMinePayoutsController,
  listContributorsController,
  runSettlementController,
  listSettlementsController,
} from "./payout.controller.js";

const router = Router();

// Contributor: own payouts
router.get(
  "/mine",
  authMiddleware,
  roleMiddleware("ADMIN", "CONTRIBUTOR"),
  listMinePayoutsController,
);

// Admin: payout management
router.get(
  "/contributors",
  authMiddleware,
  roleMiddleware("ADMIN"),
  listContributorsController,
);
router.post(
  "/settle",
  authMiddleware,
  roleMiddleware("ADMIN"),
  runSettlementController,
);
router.get(
  "/settlements",
  authMiddleware,
  roleMiddleware("ADMIN"),
  listSettlementsController,
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createPayoutController,
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  listPayoutsController,
);

export default router;
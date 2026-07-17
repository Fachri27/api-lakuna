import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { 
  createSubscriptionController,
  getSubscriptionController,
  cancelSubscriptionController,
  refreshSubscriptionController,
  createStandarPurchaseController,
  getStandarLicenseController,
  redeemStandarLicenseController,
  getInstallmentsController,
  payRemainingBalanceController,
  getAdminSubscriptionsController,
  expireSubscriptionByAdminController,
} from "./subscription.controller.js";
import { validate } from "../../middlewares/validate.js";
import { CreateSubscriptionSchema } from "./subscription.schema.js";

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management
 */

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     summary: Get user subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *   post:
 *     summary: Create subscription (create Midtrans Snap token)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               billing:
 *                 type: string
 *                 enum: [annual, monthly]
 *               payOption:
 *                 type: string
 *                 enum: [monthly, upfront]
 *     responses:
 *       201:
 *         description: Subscription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     snapToken:
 *                       type: string
 *                     redirectUrl:
 *                       type: string
 *   delete:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

const routerSubs = Router();

// User endpoint
routerSubs.get("/", authMiddleware, getSubscriptionController);

routerSubs.post("/", authMiddleware, validate(CreateSubscriptionSchema), createSubscriptionController);

// Cancel subscription
routerSubs.delete("/", authMiddleware, cancelSubscriptionController);

// Refresh subscription cache
routerSubs.post("/refresh", authMiddleware, refreshSubscriptionController);

// Standar plan - one time purchase
routerSubs.post("/standar", authMiddleware, createStandarPurchaseController);

// Standar license routes
routerSubs.get("/standar/license", authMiddleware, getStandarLicenseController);
routerSubs.post("/standar/license/redeem", authMiddleware, redeemStandarLicenseController);

// Billing installments
routerSubs.get("/installments", authMiddleware, getInstallmentsController);
routerSubs.post("/installments/pay-remaining", authMiddleware, payRemainingBalanceController);

// Admin endpoints
routerSubs.get("/admin", authMiddleware, roleMiddleware("ADMIN"), getAdminSubscriptionsController);
routerSubs.patch("/admin/:userId/expire", authMiddleware, roleMiddleware("ADMIN"), expireSubscriptionByAdminController);

export default routerSubs;
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
declare const routerSubs: import("express-serve-static-core").Router;
export default routerSubs;
//# sourceMappingURL=subscription.router.d.ts.map
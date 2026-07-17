import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { updateUserSchema } from "./user.schema.js";
import {
  deleteMeController,
  getMeController,
  updateAvatarController,
  updaterUserController,
  getAllUsersController,
  updateUserRoleController,
} from "./user.controller.js";
import { upload } from "../../middlewares/upload.js";
import { roleMiddleware } from "../../middlewares/role.js";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               realName:
 *                 type: string
 *               newsletter:
 *                 type: boolean
 */

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 */

const routerUser = Router();

routerUser.patch(
  "/me",
  authMiddleware,
  validate(updateUserSchema),
  updaterUserController,
);

routerUser.get("/me", authMiddleware, getMeController);

routerUser.patch(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  updateAvatarController,
);

routerUser.delete("/me", authMiddleware, deleteMeController);

routerUser.patch(
  "/:id/role",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateUserRoleController,
);

// Admin: Get all users
routerUser.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllUsersController,
);

export default routerUser;

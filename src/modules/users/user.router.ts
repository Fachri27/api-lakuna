import { Router, type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { changePasswordSchema, newsletterSchema, updateUserSchema } from "./user.schema.js";
import {
  changePasswordController,
  deleteMeController,
  getMeController,
  updateAvatarController,
  updateNewsletterController,
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

// Guard: tolak admin yang mengubah role dirinya sendiri (anti self-demote/lockout)
function rejectSelfRoleChange(req: Request, res: Response, next: NextFunction) {
  const targetId = req.params.id as string;
  const actorId = req.user?.userId;
  if (actorId && targetId === actorId) {
    return res.status(403).json({
      success: false,
      error: {
        code: "CANNOT_CHANGE_OWN_ROLE",
        message: "Tidak dapat mengubah role sendiri",
      },
    });
  }
  next();
}

routerUser.patch(
  "/me",
  authMiddleware,
  validate(updateUserSchema),
  updaterUserController,
);

routerUser.post(
  "/me/password",
  authMiddleware,
  validate(changePasswordSchema),
  changePasswordController,
);

routerUser.patch(
  "/me/newsletter",
  authMiddleware,
  validate(newsletterSchema),
  updateNewsletterController,
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
  rejectSelfRoleChange,
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

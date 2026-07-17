import { Router } from "express";
import { GetPhotoController, GetPhotoByIdController, GetPhotoByRelatedController, createPhotoController, updatePhotoController, deletePhotoController, addPhotoKeywordController, removePhotoKeywordController, addPhotoCategoryController, removePhotoCategoryController, approvePhotoController, rejectPhotoController, getMyPhotosController, getPendingPhotosController } from "./photo.controller.js";
import { validate } from "../../middlewares/validate.js";
import { GetPhotosSchema, GetPhotoByIdSchema, GetPhotoByRelated, UpdatePhotoSchema, UploadPhotoSchema, AddPhotoKeywordSchema, RemovePhotoKeywordSchema, AddPhotoCategorySchema, RemovePhotoCategorySchema } from "./photo.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/upload.js";
import { roleMiddleware } from "../../middlewares/role.js";

const routerPhoto = Router();

/**
 * @swagger
 * /api/photos:
 *   get:
 *     summary: Get list of photos
 *     tags: [Photos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or photographer
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: "Items per page (default: 12)"
 *     responses:
 *       200:
 *         description: List of photos
 */
routerPhoto.get(
    "/",
    validate(GetPhotosSchema),
    GetPhotoController,
);

// Must be before /:id to avoid route conflict
routerPhoto.get(
    "/my",
    authMiddleware,
    roleMiddleware("ADMIN", "CONTRIBUTOR"),
    getMyPhotosController,
)

routerPhoto.get(
    "/pending",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getPendingPhotosController,
)

/**
 * @swagger
 * /api/photos/{id}:
 *   get:
 *     summary: Get photo by ID
 *     tags: [Photos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *     responses:
 *       200:
 *         description: Photo data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 photographer:
 *                   type: string
 *                 price:
 *                   type: integer
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Photo not found
 */
routerPhoto.get(
    "/:id",
    validate(GetPhotoByIdSchema),
    GetPhotoByIdController,
);

routerPhoto.get(
    "/:id/related",
    validate(GetPhotoByRelated),
    GetPhotoByRelatedController
);

routerPhoto.post(
    "/",
    authMiddleware,
    upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "watermark", maxCount: 1 },
    ]),
    validate(UploadPhotoSchema),
    roleMiddleware("ADMIN", "CONTRIBUTOR"),
    createPhotoController,
)

// Admin approval/rejection
routerPhoto.patch(
    "/:id/approve",
    authMiddleware,
    roleMiddleware("ADMIN"),
    approvePhotoController,
)

routerPhoto.patch(
    "/:id/reject",
    authMiddleware,
    roleMiddleware("ADMIN"),
    rejectPhotoController,
)

/**
 * @swagger
 * /api/photos/{id}:
 *   patch:
 *     summary: Update photo
 *     tags: [Photos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               photographer:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Photo updated
 *       404:
 *         description: Photo not found
 */
routerPhoto.patch(
    "/:id",
    authMiddleware,
    upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "watermark", maxCount: 1 },
    ]),
    validate(UpdatePhotoSchema),
    roleMiddleware("ADMIN"),
    updatePhotoController,
);

routerPhoto.delete(
    "/:id",
    authMiddleware,
    deletePhotoController,
);

/**
 * @swagger
 * /api/photos/{id}/keywords:
 *   post:
 *     summary: Add keywords to photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywordIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of keyword UUIDs
 *     responses:
 *       200:
 *         description: Keywords added
 *       404:
 *         description: Photo or keywords not found
 */
routerPhoto.post(
    "/:id/keywords",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(AddPhotoKeywordSchema),
    addPhotoKeywordController,
);

/**
 * @swagger
 * /api/photos/{id}/keywords/{keywordId}:
 *   delete:
 *     summary: Remove keyword from photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *       - in: path
 *         name: keywordId
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword UUID
 *     responses:
 *       200:
 *         description: Keyword removed
 *       404:
 *         description: Photo keyword not found
 */
routerPhoto.delete(
    "/:id/keywords/:keywordId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(RemovePhotoKeywordSchema),
    removePhotoKeywordController,
);

/**
 * @swagger
 * /api/photos/{id}/categories:
 *   post:
 *     summary: Add categories to photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category UUIDs
 *     responses:
 *       200:
 *         description: Categories added
 *       404:
 *         description: Photo or categories not found
 */
routerPhoto.post(
    "/:id/categories",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(AddPhotoCategorySchema),
    addPhotoCategoryController,
);

/**
 * @swagger
 * /api/photos/{id}/categories/{categoryId}:
 *   delete:
 *     summary: Remove category from photo
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category UUID
 *     responses:
 *       200:
 *         description: Category removed
 *       404:
 *         description: Photo category not found
 */
routerPhoto.delete(
    "/:id/categories/:categoryId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(RemovePhotoCategorySchema),
    removePhotoCategoryController,
);

export default routerPhoto;
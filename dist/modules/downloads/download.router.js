import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { downloadRateLimiter } from "../../middlewares/rateLimit.js";
import { downloadPhotoController, getDownloadController, downloadLicensePdfController } from "./download.controller.js";
/**
 * @swagger
 * tags:
 *   name: Downloads
 *   description: Photo download endpoints
 */
/**
 * @swagger
 * /api/downloads:
 *   get:
 *     summary: Get user's downloads/licenses
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of downloads
 */
/**
 * @swagger
 * /api/downloads/{photoId}:
 *   get:
 *     summary: Download photo
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo UUID
 *     responses:
 *       200:
 *         description: Download URL
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
 *                     downloadUrl:
 *                       type: string
 *       403:
 *         description: Quota exceeded or subscription inactive
 */
const routerDownload = Router();
routerDownload.get("/", authMiddleware, getDownloadController);
routerDownload.get("/:photoId", authMiddleware, downloadRateLimiter, downloadPhotoController);
routerDownload.get("/license/:licenseId", authMiddleware, downloadLicensePdfController);
export default routerDownload;
//# sourceMappingURL=download.router.js.map
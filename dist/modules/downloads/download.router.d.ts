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
declare const routerDownload: import("express-serve-static-core").Router;
export default routerDownload;
//# sourceMappingURL=download.router.d.ts.map
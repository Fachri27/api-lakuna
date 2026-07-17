import { Router } from "express";
import { GetKeywordsController, GetKeywordByIdController, CreateKeywordController, UpdateKeywordController, DeleteKeywordController, } from "./keyword.controller.js";
import { validate } from "../../middlewares/validate.js";
import { GetKeywordsSchema, GetKeywordByIdSchema, CreateKeywordSchema, UpdateKeywordSchema, DeleteKeywordSchema, } from "./keyword.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
const routerKeyword = Router();
/**
 * @swagger
 * /api/keywords:
 *   get:
 *     summary: Get list of keywords
 *     tags: [Keywords]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Items per page (default: 20)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by keyword name
 *     responses:
 *       200:
 *         description: List of keywords
 */
routerKeyword.get("/", validate(GetKeywordsSchema), GetKeywordsController);
/**
 * @swagger
 * /api/keywords/{id}:
 *   get:
 *     summary: Get keyword by ID
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword UUID
 *     responses:
 *       200:
 *         description: Keyword data
 *       404:
 *         description: Keyword not found
 */
routerKeyword.get("/:id", validate(GetKeywordByIdSchema), GetKeywordByIdController);
/**
 * @swagger
 * /api/keywords:
 *   post:
 *     summary: Create new keyword
 *     tags: [Keywords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Keyword name
 *     responses:
 *       201:
 *         description: Keyword created
 *       409:
 *         description: Keyword already exists
 */
routerKeyword.post("/", authMiddleware, roleMiddleware("ADMIN"), validate(CreateKeywordSchema), CreateKeywordController);
/**
 * @swagger
 * /api/keywords/{id}:
 *   patch:
 *     summary: Update keyword
 *     tags: [Keywords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Keyword name
 *     responses:
 *       200:
 *         description: Keyword updated
 *       404:
 *         description: Keyword not found
 *       409:
 *         description: Keyword already exists
 */
routerKeyword.patch("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(UpdateKeywordSchema), UpdateKeywordController);
/**
 * @swagger
 * /api/keywords/{id}:
 *   delete:
 *     summary: Delete keyword
 *     tags: [Keywords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword UUID
 *     responses:
 *       200:
 *         description: Keyword deleted
 *       404:
 *         description: Keyword not found
 *       400:
 *         description: Keyword in use by photos
 */
routerKeyword.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(DeleteKeywordSchema), DeleteKeywordController);
export default routerKeyword;
//# sourceMappingURL=keyword.router.js.map
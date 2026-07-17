import { Router } from "express";
import { GetCategoriesController, GetCategoryByIdController, CreateCategoryController, UpdateCategoryController, DeleteCategoryController, } from "./category.controller.js";
import { validate } from "../../middlewares/validate.js";
import { GetCategoriesSchema, GetCategoryByIdSchema, CreateCategorySchema, UpdateCategorySchema, DeleteCategorySchema, } from "./category.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
const router = Router();
// GET /categories - list semua category
router.get("/", validate(GetCategoriesSchema), GetCategoriesController);
// GET /categories/:id - ambil category by ID
router.get("/:id", validate(GetCategoryByIdSchema), GetCategoryByIdController);
// POST /categories - buat category baru
router.post("/", authMiddleware, roleMiddleware("ADMIN"), validate(CreateCategorySchema), CreateCategoryController);
// PATCH /categories/:id - update category
router.patch("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(UpdateCategorySchema), UpdateCategoryController);
// DELETE /categories/:id - hapus category
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(DeleteCategorySchema), DeleteCategoryController);
export default router;
//# sourceMappingURL=category.router.js.map
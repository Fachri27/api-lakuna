import { getCategoriesService, getCategoryByIdService, createCategoryService, updateCategoryService, deleteCategoryService, } from "./category.service.js";
// Controller untuk GET /categories
export async function GetCategoriesController(req, res, next) {
    try {
        const result = await getCategoriesService(req.query);
        return res.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk GET /categories/:id
export async function GetCategoryByIdController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new Error("ID category tidak valid");
        }
        const category = await getCategoryByIdService(id);
        return res.json({
            success: true,
            data: category,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk POST /categories
export async function CreateCategoryController(req, res, next) {
    try {
        const category = await createCategoryService(req.body);
        return res.status(201).json({
            success: true,
            data: category,
            message: "Category berhasil dibuat",
        });
    }
    catch (err) {
        // Handle specific Prisma errors
        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "DUPLICATE_ERROR",
                    message: "Category dengan nama ini sudah ada",
                },
            });
        }
        next(err);
    }
}
// Controller untuk PATCH /categories/:id
export async function UpdateCategoryController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new Error("ID category tidak valid");
        }
        const category = await updateCategoryService(id, req.body);
        return res.json({
            success: true,
            data: category,
            message: "Category berhasil diupdate",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk DELETE /categories/:id
export async function DeleteCategoryController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new Error("ID category tidak valid");
        }
        await deleteCategoryService(id);
        return res.json({
            success: true,
            message: "Category berhasil dihapus",
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=category.controller.js.map
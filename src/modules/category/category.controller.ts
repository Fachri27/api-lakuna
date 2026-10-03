import { NextFunction, Request, Response } from "express";
import {
  getCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "./category.service.js";
import { AppError } from "../../middlewares/errorHandler.js";

// Controller untuk GET /categories
export async function GetCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getCategoriesService(req.query as any);

    return res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk GET /categories/:id
export async function GetCategoryByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new Error("ID category tidak valid");
    }

    const category = await getCategoryByIdService(id);

    if (!category) {
      throw new AppError(404, "NOT_FOUND", "Category tidak ditemukan");
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk POST /categories
export async function CreateCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const file = req.file as Express.Multer.File | undefined;
    const category = await createCategoryService(req.body, file);

    return res.status(201).json({
      success: true,
      data: category,
      message: "Category berhasil dibuat",
    });
  } catch (err: any) {
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
export async function UpdateCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new Error("ID category tidak valid");
    }

    const file = req.file as Express.Multer.File | undefined;
    const category = await updateCategoryService(id, req.body as any, file);

    return res.json({
      success: true,
      data: category,
      message: "Category berhasil diupdate",
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk DELETE /categories/:id
export async function DeleteCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}
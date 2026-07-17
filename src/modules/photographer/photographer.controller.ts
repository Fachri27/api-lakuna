import { NextFunction, Request, Response } from "express";
import {
  getPhotographersService,
  getPhotographerByIdService,
  createPhotographerService,
  updatePhotographerService,
  deletePhotographerService,
} from "./photographer.service.js";
import { AppError } from "../../middlewares/errorHandler.js";

export async function GetPhotographersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getPhotographersService(req.query as any);
    return res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function GetPhotographerByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    if (!id || Array.isArray(id)) {
      throw new AppError(400, "INVALID_ID", "ID fotografer tidak valid");
    }
    const photographer = await getPhotographerByIdService(id);
    return res.json({ success: true, data: photographer });
  } catch (err) {
    next(err);
  }
}

export async function CreatePhotographerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const photographer = await createPhotographerService(req.body as any);
    return res.status(201).json({
      success: true,
      data: photographer,
      message: "Fotografer berhasil dibuat",
    });
  } catch (err) {
    next(err);
  }
}

export async function UpdatePhotographerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    if (!id || Array.isArray(id)) {
      throw new AppError(400, "INVALID_ID", "ID fotografer tidak valid");
    }
    const photographer = await updatePhotographerService(id, req.body as any);
    return res.json({
      success: true,
      data: photographer,
      message: "Fotografer berhasil diupdate",
    });
  } catch (err) {
    next(err);
  }
}

export async function DeletePhotographerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    if (!id || Array.isArray(id)) {
      throw new AppError(400, "INVALID_ID", "ID fotografer tidak valid");
    }
    await deletePhotographerService(id);
    return res.json({ success: true, message: "Fotografer berhasil dihapus" });
  } catch (err) {
    next(err);
  }
}

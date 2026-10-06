import type { NextFunction, Request, Response } from "express";
import {
  listLogosService,
  createLogoService,
  updateLogoService,
  deleteLogoService,
  orderLogosService,
} from "./logo.service.js";
import { AppError } from "../../middlewares/errorHandler.js";

export async function listLogosController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listLogosService();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, "NO_FILE", "Unggah berkas logo dulu");
    const data = await createLogoService(String(req.body?.name ?? ""), file);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const name = typeof req.body?.name === "string" ? req.body.name : undefined;
    if (!file && name === undefined) {
      throw new AppError(400, "NOTHING_TO_UPDATE", "Isi nama baru atau pilih gambar pengganti");
    }
    const data = await updateLogoService(req.params.id as string, { name, file });
    if (!data) throw new AppError(404, "LOGO_NOT_FOUND", "Logo tidak ditemukan");
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = await deleteLogoService(req.params.id as string);
    if (!ok) throw new AppError(404, "LOGO_NOT_FOUND", "Logo tidak ditemukan");
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

export async function orderLogosController(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = (req.body?.ids ?? []) as string[];
    const data = await orderLogosService(ids.filter((x) => typeof x === "string"));
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

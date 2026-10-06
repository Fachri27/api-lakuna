import type { NextFunction, Request, Response } from "express";
import {
  createSupportMessageService,
  listSupportMessagesService,
  updateSupportMessageStatusService,
} from "./support.service.js";
import { AppError } from "../../middlewares/errorHandler.js";

export async function createSupportMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    // Kolom jebakan terisi = bot. Jawab sukses palsu tanpa menyimpan supaya bot tak belajar menghindarinya.
    if (req.body?.website) {
      return res.status(201).json({ success: true, data: { ref: "LKN-00000000" } });
    }
    const { name, email, topic, orderId, message } = req.body;
    const data = await createSupportMessageService({ name, email, topic, orderId, message });
    return res.status(201).json({ success: true, data: { ref: data.ref } });
  } catch (err) {
    next(err);
  }
}

export async function listSupportMessagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query as unknown as { status?: string; page: number; limit: number };
    const data = await listSupportMessagesService({ status, page, limit });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateSupportMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await updateSupportMessageStatusService(req.params.id as string, req.body.status);
    if (!data) throw new AppError(404, "MESSAGE_NOT_FOUND", "Pesan tidak ditemukan");
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

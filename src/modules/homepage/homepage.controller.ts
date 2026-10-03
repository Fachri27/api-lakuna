import type { NextFunction, Request, Response } from "express";
import {
  getHomepageService,
  getHomepageSectionService,
  upsertHomepageSectionService,
} from "./homepage.service.js";

export async function getHomepageController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sections = await getHomepageService();
    return res.status(200).json({ success: true, data: sections });
  } catch (err) {
    next(err);
  }
}

export async function getHomepageSectionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const key = String(req.params.key ?? "");
    const section = await getHomepageSectionService(key);
    return res.status(200).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
}

export async function upsertHomepageSectionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const key = String(req.params.key ?? "");
    const file = req.file as Express.Multer.File | undefined;
    const body = (req.body ?? {}) as Record<string, string>;
    // photoIds dikirim sebagai string JSON (multipart) — array id foto terpilih
    // untuk section journeys/orbit. Bila tidak ada, lewat undefined (pertahankan lama).
    let photoIds: string[] | undefined;
    if (typeof body.photoIds === "string" && body.photoIds.length > 0) {
      try {
        const parsed = JSON.parse(body.photoIds);
        if (Array.isArray(parsed)) photoIds = parsed.filter((x) => typeof x === "string");
      } catch {
        photoIds = undefined;
      }
    } else if (body.photoIds === "") {
      // string kosong → admin mengosongkan daftar
      photoIds = [];
    }
    const section = await upsertHomepageSectionService(
      key,
      {
        kicker: body.kicker,
        title: body.title,
        body: body.body,
        cta: body.cta,
      },
      file,
      photoIds,
    );
    return res.status(200).json({
      success: true,
      data: section,
      message: "Bagian homepage berhasil disimpan",
    });
  } catch (err) {
    next(err);
  }
}
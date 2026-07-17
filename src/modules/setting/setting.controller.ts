import { NextFunction, Request, Response } from "express";
import {
  getSettingService,
  getSettingsService,
  updateSettingService,
} from "./setting.service.js";

export async function getSettingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const key = req.params.key as string;
    const setting = await getSettingService(key);
    return res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
}

export async function getSettingsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const settings = await getSettingsService();
    return res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const key = req.params.key as string;
    const { value } = req.body;
    const setting = await updateSettingService(key, String(value));
    return res.json({
      success: true,
      message: "Setting berhasil diupdate",
      data: setting,
    });
  } catch (err) {
    next(err);
  }
}

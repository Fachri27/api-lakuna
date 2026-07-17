import { NextFunction, Request, Response } from "express";
import {
  getMyEarnings,
  getMySummary,
  listAllEarnings,
} from "./earning.service.js";

export async function getMyEarningsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getMyEarnings(req.user!.userId, req.query);
    return res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getMySummaryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMySummary(req.user!.userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listAllEarningsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await listAllEarnings(req.query);
    return res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}
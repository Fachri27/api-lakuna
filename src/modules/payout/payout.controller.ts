import { NextFunction, Request, Response } from "express";
import {
  createPayoutService,
  listPayouts,
  listMinePayouts,
  listContributorsWithBalance,
  listSettlements,
  runSettlement,
} from "./payout.service.js";
import { AppError } from "../../middlewares/errorHandler.js";

// Admin: record a payout
export async function createPayoutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { contributorId, amount, method, reference, note } = req.body;
    if (!contributorId || !method) {
      throw new AppError(400, "BAD_REQUEST", "contributorId dan method wajib diisi");
    }
    const data = await createPayoutService(
      { contributorId, amount, method, reference, note },
      req.user!.userId,
    );
    return res.json({ success: true, message: "Payout tercatat", data });
  } catch (err) {
    next(err);
  }
}

// Admin: list all payouts
export async function listPayoutsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await listPayouts(req.query);
    return res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

// Contributor: own payouts
export async function listMinePayoutsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await listMinePayouts(req.user!.userId, req.query);
    return res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

// Admin: contributors with balances (for the payout page)
export async function listContributorsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await listContributorsWithBalance();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Admin: run settlement for a period
export async function runSettlementController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period } = req.body;
    if (!period) {
      throw new AppError(400, "BAD_REQUEST", "period (YYYY-MM) wajib diisi");
    }
    const data = await runSettlement(String(period), req.user!.userId);
    return res.json({ success: true, message: "Settlement selesai", data });
  } catch (err) {
    next(err);
  }
}

// Admin: settlement history
export async function listSettlementsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await listSettlements();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
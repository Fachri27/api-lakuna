import { NextFunction, Request, Response } from "express";
import {
  getAllPlansService,
  createPlanService,
  updatePlanService,
  deletePlanService,
} from "./plan.service.js";

export async function getAllPlansController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const plans = await getAllPlansService();
    return res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
}

export async function createPlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, badge, description, quota, priceMonthly, priceAnnual, highlight } = req.body;

    const plan = await createPlanService({ name, badge, description, quota, priceMonthly, priceAnnual, highlight });
    return res.status(201).json({
      success: true,
      message: "Plan berhasil dibuat",
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const { name, badge, description, quota, priceMonthly, priceAnnual, highlight, isActive } = req.body;

    const plan = await updatePlanService(id, {
      name,
      badge,
      description,
      quota,
      priceMonthly,
      priceAnnual,
      highlight,
      isActive,
    });

    return res.json({
      success: true,
      message: "Plan berhasil diupdate",
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    await deletePlanService(id);

    return res.json({
      success: true,
      message: "Plan berhasil dihapus",
    });
  } catch (err) {
    next(err);
  }
}

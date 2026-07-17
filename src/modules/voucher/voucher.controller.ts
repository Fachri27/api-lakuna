import { NextFunction, Request, Response } from "express";
import {
  getVouchersService,
  getVoucherByIdService,
  createVoucherService,
  updateVoucherService,
  deleteVoucherService,
} from "./voucher.service.js";
import { validateVoucher } from "../discount/discount.service.js";
import { getAuthUser } from "../../utils/auth.js";

// GET /vouchers
export async function GetVouchersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getVouchersService(req.query as any);
    return res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /vouchers/:id
export async function GetVoucherByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID voucher tidak valid");
    }
    const voucher = await getVoucherByIdService(id);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Voucher tidak ditemukan" } });
    }
    return res.json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
}

// POST /vouchers
export async function CreateVoucherController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const voucher = await createVoucherService(req.body);
    return res.status(201).json({
      success: true,
      data: voucher,
      message: "Voucher berhasil dibuat",
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_ERROR",
          message: "Kode voucher sudah dipakai",
        },
      });
    }
    next(err);
  }
}

// PATCH /vouchers/:id
export async function UpdateVoucherController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID voucher tidak valid");
    }
    const voucher = await updateVoucherService(id, req.body);
    return res.json({
      success: true,
      data: voucher,
      message: "Voucher berhasil diupdate",
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_ERROR",
          message: "Kode voucher sudah dipakai",
        },
      });
    }
    next(err);
  }
}

// DELETE /vouchers/:id
export async function DeleteVoucherController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID voucher tidak valid");
    }
    await deleteVoucherService(id);
    return res.json({ success: true, message: "Voucher berhasil dihapus" });
  } catch (err) {
    next(err);
  }
}

// POST /vouchers/validate (publik)
export async function ValidateVoucherController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { code, scope, amount } = req.body;
    const userId = getAuthUser(req).userId;
    const result = await validateVoucher({ code, scope, userId, amount });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
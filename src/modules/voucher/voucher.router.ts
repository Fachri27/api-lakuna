import { Router } from "express";
import {
  GetVouchersController,
  GetVoucherByIdController,
  CreateVoucherController,
  UpdateVoucherController,
  DeleteVoucherController,
  ValidateVoucherController,
  GetActiveVoucherController,
} from "./voucher.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  GetVouchersSchema,
  GetVoucherByIdSchema,
  CreateVoucherSchema,
  UpdateVoucherSchema,
  DeleteVoucherSchema,
  ValidateVoucherSchema,
} from "./voucher.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";

const routerVoucher = Router();

// GET /vouchers/active (publik — tanpa auth)
routerVoucher.get("/active", GetActiveVoucherController);

// GET /vouchers - list
routerVoucher.get("/", authMiddleware, roleMiddleware("ADMIN"), validate(GetVouchersSchema), GetVouchersController);

// POST /vouchers/validate (publik — butuh auth untuk cek kuota per-user)
routerVoucher.post("/validate", authMiddleware, validate(ValidateVoucherSchema), ValidateVoucherController);

// GET /vouchers/:id
routerVoucher.get("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(GetVoucherByIdSchema), GetVoucherByIdController);

// POST /vouchers
routerVoucher.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(CreateVoucherSchema),
  CreateVoucherController,
);

// PATCH /vouchers/:id
routerVoucher.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(UpdateVoucherSchema),
  UpdateVoucherController,
);

// DELETE /vouchers/:id
routerVoucher.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(DeleteVoucherSchema),
  DeleteVoucherController,
);

export default routerVoucher;
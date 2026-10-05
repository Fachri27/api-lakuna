import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { upload } from "../../middlewares/upload.js";
import { validate } from "../../middlewares/validate.js";
import {
  ListLogosSchema,
  CreateLogoSchema,
  RenameLogoSchema,
  DeleteLogoSchema,
  OrderLogosSchema,
} from "./logo.schema.js";
import {
  listLogosController,
  createLogoController,
  renameLogoController,
  deleteLogoController,
  orderLogosController,
} from "./logo.controller.js";

const routerLogo = Router();

// Publik — dinding logo "Dipercaya tim di".
routerLogo.get("/", validate(ListLogosSchema), listLogosController);

// Admin — kelola logo pelanggan.
routerLogo.put(
  "/order",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(OrderLogosSchema),
  orderLogosController,
);
routerLogo.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  upload.single("image"),
  validate(CreateLogoSchema),
  createLogoController,
);
routerLogo.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(RenameLogoSchema),
  renameLogoController,
);
routerLogo.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(DeleteLogoSchema),
  deleteLogoController,
);

export default routerLogo;

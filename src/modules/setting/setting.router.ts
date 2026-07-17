import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import {
  getSettingController,
  getSettingsController,
  updateSettingController,
} from "./setting.controller.js";

const routerSetting = Router();

// Public - user/visitor can view settings (e.g. standard plan price)
routerSetting.get("/", getSettingsController);
routerSetting.get("/:key", getSettingController);

// Admin only - update settings
routerSetting.patch("/:key", authMiddleware, roleMiddleware("ADMIN"), updateSettingController);
routerSetting.put("/:key", authMiddleware, roleMiddleware("ADMIN"), updateSettingController);

export default routerSetting;

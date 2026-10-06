import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { validate } from "../../middlewares/validate.js";
import { supportRateLimiter } from "../../middlewares/rateLimit.js";
import {
  CreateSupportMessageSchema,
  ListSupportMessagesSchema,
  UpdateSupportMessageSchema,
} from "./support.schema.js";
import {
  createSupportMessageController,
  listSupportMessagesController,
  updateSupportMessageController,
} from "./support.controller.js";

const routerSupport = Router();

// Publik — formulir Customer service (dibatasi per IP).
routerSupport.post("/", supportRateLimiter, validate(CreateSupportMessageSchema), createSupportMessageController);

// Admin — kotak masuk di CMS.
routerSupport.get("/", authMiddleware, roleMiddleware("ADMIN"), validate(ListSupportMessagesSchema), listSupportMessagesController);
routerSupport.patch("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(UpdateSupportMessageSchema), updateSupportMessageController);

export default routerSupport;

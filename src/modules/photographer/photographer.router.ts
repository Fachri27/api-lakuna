import { Router } from "express";
import {
  GetPhotographersController,
  GetPhotographerByIdController,
  CreatePhotographerController,
  UpdatePhotographerController,
  DeletePhotographerController,
} from "./photographer.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  GetPhotographersSchema,
  GetPhotographerByIdSchema,
  CreatePhotographerSchema,
  UpdatePhotographerSchema,
  DeletePhotographerSchema,
} from "./photographer.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";

const routerPhotographer = Router();

routerPhotographer.get("/", validate(GetPhotographersSchema), GetPhotographersController);

routerPhotographer.get(
  "/:id",
  validate(GetPhotographerByIdSchema),
  GetPhotographerByIdController,
);

routerPhotographer.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(CreatePhotographerSchema),
  CreatePhotographerController,
);

routerPhotographer.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(UpdatePhotographerSchema),
  UpdatePhotographerController,
);

routerPhotographer.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(DeletePhotographerSchema),
  DeletePhotographerController,
);

export default routerPhotographer;

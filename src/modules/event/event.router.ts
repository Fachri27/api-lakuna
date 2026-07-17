import { Router } from "express";
import {
  GetEventsController,
  GetEventByIdController,
  CreateEventController,
  UpdateEventController,
  DeleteEventController,
  GetActiveEventsController,
} from "./event.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  GetEventsSchema,
  GetEventByIdSchema,
  CreateEventSchema,
  UpdateEventSchema,
  DeleteEventSchema,
  GetActiveEventsSchema,
} from "./event.schema.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";

const routerEvent = Router();

// GET /events - list
routerEvent.get("/", authMiddleware, roleMiddleware("ADMIN"), validate(GetEventsSchema), GetEventsController);

// GET /events/active (publik — event aktif untuk photoId/planId)
routerEvent.get("/active", validate(GetActiveEventsSchema), GetActiveEventsController);

// GET /events/:id
routerEvent.get("/:id", authMiddleware, roleMiddleware("ADMIN"), validate(GetEventByIdSchema), GetEventByIdController);

// POST /events
routerEvent.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(CreateEventSchema),
  CreateEventController,
);

// PATCH /events/:id
routerEvent.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(UpdateEventSchema),
  UpdateEventController,
);

// DELETE /events/:id
routerEvent.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(DeleteEventSchema),
  DeleteEventController,
);

export default routerEvent;
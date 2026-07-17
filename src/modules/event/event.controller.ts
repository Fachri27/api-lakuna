import { NextFunction, Request, Response } from "express";
import {
  getEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService,
  getActiveEventsService,
} from "./event.service.js";

// GET /events
export async function GetEventsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getEventsService(req.query as any);
    return res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /events/active (publik)
export async function GetActiveEventsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getActiveEventsService(req.query as any);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /events/:id
export async function GetEventByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID event tidak valid");
    }
    const event = await getEventByIdService(id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Event tidak ditemukan" } });
    }
    return res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

// POST /events
export async function CreateEventController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const event = await createEventService(req.body);
    return res.status(201).json({
      success: true,
      data: event,
      message: "Event berhasil dibuat",
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: { code: "TARGET_NOT_FOUND", message: "Salah satu target (foto/plan) tidak ditemukan" },
      });
    }
    next(err);
  }
}

// PATCH /events/:id
export async function UpdateEventController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID event tidak valid");
    }
    const event = await updateEventService(id, req.body);
    return res.json({
      success: true,
      data: event,
      message: "Event berhasil diupdate",
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: { code: "TARGET_NOT_FOUND", message: "Salah satu target (foto/plan) tidak ditemukan" },
      });
    }
    next(err);
  }
}

// DELETE /events/:id
export async function DeleteEventController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new Error("ID event tidak valid");
    }
    await deleteEventService(id);
    return res.json({ success: true, message: "Event berhasil dihapus" });
  } catch (err) {
    next(err);
  }
}
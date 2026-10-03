import { NextFunction, Request, Response } from "express";
import { UPLOAD_MAX_MB } from "../config/upload.js";

function formatMb(mb: number) {
  return mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // prisma error handler
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Data sudah ada",
        },
      });
    }
  }

  // multer / upload validation error
  if (err.name === "MulterError") {
    const multerErr = err as any;
    const isUnexpectedField = multerErr.code === "LIMIT_UNEXPECTED_FILE";

    if (multerErr.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: `Ukuran file melebihi batas ${formatMb(UPLOAD_MAX_MB)}. Kompres atau potong file, lalu upload lagi.`,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: isUnexpectedField
          ? `Field upload tidak sesuai: "${multerErr.field}".`
          : err.message,
      },
    });
  }

  // Log the real error server-side, return generic message to client
  console.error("[INTERNAL_ERROR]", err);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan pada server",
    },
  });
}

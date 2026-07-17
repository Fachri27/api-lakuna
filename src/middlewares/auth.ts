import { verifyAccessToken } from "../utils/jwt.js";
import { redisClient } from "../config/redis.js";
import { NextFunction, Request, Response } from "express";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // ambil bearer dari header atau cookie
    const authHeader = req.headers.authorization;
    let token = authHeader?.split(" ")[1];
    
    // Cek cookie jika tidak ada di header
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Token tidak ditemukan",
        },
      });
    }

    // Validate token format (basic check)
    if (typeof token !== 'string' || token.length < 10) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token tidak valid",
        },
      });
    }

    // cek blacklist
    const blacklisted = await redisClient.get(`blacklist:${token}`);

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_BLACKLISTED",
          message: "Sudah logout",
        },
      });
    }

    let payload: { userId: string; role: string; email?: string };
    try {
      payload = verifyAccessToken(token) as { userId: string; role: string; email?: string };
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token tidak valid atau sudah kedaluwarsa",
        },
      });
    }

    // Validate payload
    if (!payload.userId || !payload.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token tidak lengkap",
        },
      });
    }

    // inject user ke request
    req.user = payload;

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Token tidak valid",
      },
    });
  }
}

// auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { logoutService, registerService } from "./auth.service.js";
import { loginService } from "./auth.service.js";
import { signAccessToken, verifyRefreshToken } from "../../utils/jwt.js";
import { redisClient } from "../../config/redis.js";
import { prisma } from "../../config/db.js";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await registerService(req.body);

    return res.status(201).json({
      success: true,
      message: "Register berhasil",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await loginService(req.body);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 60 * 15 * 1000,
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });

  } catch (err) {
    next(err);
  }
}

// refresh
export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      // verify jwt
      const payload = verifyRefreshToken(refreshToken) as { userId: string};

      // cek redis
      const savedToken = await redisClient.get(
        `refreshToken:${payload.userId}`
      );

      if(!savedToken || savedToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Refresh token tidak valid",
          },
        });
      }

      // cek kalo user sudah di hapus
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          deletedAt: null
        },
      });

      if(!user) {
        await redisClient.del(
          `refreshToken:${payload.userId}`
        );

        return res.status(401).json({
          success: false,
          error: {
            code: "ACCOUNT_DELETED",
            message: "Akun sudah di hapus"
          },
        });
      }

      // buat akses token baru
      const newToken = signAccessToken({
        userId: payload.userId,
        role: user.role,
      });

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("accessToken", newToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 60 * 15 * 1000,
      });

      return res.json({
        success: true,
        data: {
          newToken,
        }
      });

    } catch(err) {
      next(err);
    }
}

// logout
export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    // header auth
    const authHeader = req.headers.authorization;

    const accessToken = authHeader?.split(" ")[1];

    if(!accessToken) {
      return res.status(401).json({
        success: false,
      });
    }

    // panggil si service
    await logoutService(accessToken);

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    });

    return res.json({
      success: true,
      message: "Logout berhasil",
    });

  } catch(err) {
    next(err);
  }
}

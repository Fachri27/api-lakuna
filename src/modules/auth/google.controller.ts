import { Router } from "express";
import { prisma } from "../../config/db.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../middlewares/errorHandler.js";
import axios from "axios";

export async function googleAuthHandler(req: any, res: any, next: any) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw new AppError(400, "MISSING_TOKEN", "Google ID token required");
    }

    // Verify Google token
    const googleRes = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const { email, name, picture, sub: googleId } = googleRes.data;

    if (!email) {
      throw new AppError(400, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EMAIL_NOT_REGISTERED",
          message: "Email ini belum terdaftar. Silakan registrasi terlebih dahulu.",
          email,
          name,
        },
      });
    }

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          realName: user.realName,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
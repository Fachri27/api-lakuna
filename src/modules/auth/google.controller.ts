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

    // Batasi panjang idToken (tidak ada schema zod untuk endpoint ini di
    // auth.schema.ts/auth.router.ts) — cegah payload raksasa ke tokeninfo.
    if (typeof idToken !== "string" || idToken.length > 5000) {
      throw new AppError(400, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    }

    // Verifikasi Google token.
    // google-auth-library TIDAK tersedia di package.json, jadi validasi manual
    // field aud/iss/exp dari tokeninfo (fail-closed bila mismatch/kedaluwarsa).
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new AppError(500, "GOOGLE_CLIENT_ID_MISSING", "Google login not configured");
    }

    let tokenInfo: {
      email?: string;
      name?: string;
      picture?: string;
      sub?: string;
      aud?: string;
      iss?: string;
      exp?: string;
    };
    try {
      const googleRes = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      tokenInfo = googleRes.data;
    } catch {
      throw new AppError(400, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    }

    const { email, name, picture, sub: googleId } = tokenInfo;

    if (!email) {
      throw new AppError(400, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    }

    // aud harus sama dengan CLIENT_ID milik kita — tolak token dari app lain.
    if (tokenInfo.aud !== googleClientId) {
      throw new AppError(401, "INVALID_GOOGLE_AUDIENCE", "Google token audience mismatch");
    }

    // iss harus dari Google.
    if (
      tokenInfo.iss !== "accounts.google.com" &&
      tokenInfo.iss !== "https://accounts.google.com"
    ) {
      throw new AppError(401, "INVALID_GOOGLE_ISSUER", "Invalid Google token issuer");
    }

    // exp tidak boleh kedaluwarsa (tokeninfo mengembalikan detik epoch string).
    const expSec = Number(tokenInfo.exp);
    if (!tokenInfo.exp || !Number.isFinite(expSec) || expSec * 1000 <= Date.now()) {
      throw new AppError(401, "GOOGLE_TOKEN_EXPIRED", "Google token expired");
    }

    // Find user (samakan login normal: abaikan akun soft-deleted)
    let user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
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
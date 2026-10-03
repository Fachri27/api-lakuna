import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../config/db.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { getAuthUser } from "../../utils/auth.js";

const routerAuth = Router();

// Google OAuth routes
routerAuth.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

routerAuth.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "/login",
    session: false 
  }),
  async (req, res) => {
    const user = getAuthUser(req);
    const accessToken = signAccessToken({ userId: user.userId, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.userId });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 60 * 15 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  }
);

export default routerAuth;
import { prisma } from "../../config/db.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../middlewares/errorHandler.js";
import axios from "axios";
export async function googleAuthHandler(req, res, next) {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            throw new AppError(400, "MISSING_TOKEN", "Google ID token required");
        }
        // Verify Google token
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const { email, name, picture, sub: googleId } = googleRes.data;
        if (!email) {
            throw new AppError(400, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
        }
        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Generate unique username from email
            const baseUsername = name?.replace(/\s+/g, "").toLowerCase() || email.split("@")[0];
            let username = baseUsername;
            let counter = 1;
            // Check if username exists, if yes, append counter
            while (await prisma.user.findUnique({ where: { username } })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    realName: name || null,
                    password: googleId, // Store Google ID as password (hashed in real app)
                    avatarKey: null,
                },
            });
        }
        else {
            // User already exists, just login
            console.log(`User with email ${email} already exists, logging in...`);
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
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=google.controller.js.map
import { verifyAccessToken } from "../utils/jwt.js";
import { redisClient } from "../config/redis.js";
export async function authMiddleware(req, res, next) {
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
        let payload;
        try {
            payload = verifyAccessToken(token);
        }
        catch (jwtError) {
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
    }
    catch (err) {
        res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Token tidak valid",
            },
        });
    }
}
//# sourceMappingURL=auth.js.map
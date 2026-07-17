import jwt from "jsonwebtoken";
// Validate JWT secrets at startup
const secret = process.env.JWT_SECRET;
const secret_refresh = process.env.JWT_REFRESH_SECRET;
if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
}
if (!secret_refresh || secret_refresh.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long");
}
const JWT_SECRET = secret;
const JWT_REFRESH_SECRET = secret_refresh;
export function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
    });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map
import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// generic rate limiter factory
function createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;

}) {
    return rateLimit({
        windowMs: options.windowMs,
        max: isDev ? options.max * 50 : options.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    code: "TOO_MANY_REQUESTS",
                    message: options.message
                },
            });
        },
    });
}


// Login 10 time per 15 minutes
export const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit",
});

// Register 5 time per hour per IP
export const registerRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Terlalu banyak percobaan registrasi, silakan coba lagi dalam 1 jam",
});

// Download - 30x per hour per IP
export const downloadRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: "Terlalu banyak percobaan download, silakan coba lagi dalam 1 jam",
});

// General API — 500x per 5 menit
export const generalLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: "Terlalu banyak request, coba lagi sebentar",
});
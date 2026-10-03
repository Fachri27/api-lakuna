import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// generic rate limiter factory
function createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    // Auth limiters must enforce real limits even in dev/test;
    // otherwise the isDev multiplier makes brute-force protection untestable.
    skipDevMultiplier?: boolean;

}) {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.skipDevMultiplier || !isDev ? options.max : options.max * 50,
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


// Login 10x per menit per IP
export const loginRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "Terlalu banyak percobaan login, silakan coba lagi dalam 1 menit",
    skipDevMultiplier: true,
});

// Register 5 time per hour per IP
export const registerRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Terlalu banyak percobaan registrasi, silakan coba lagi dalam 1 jam",
    skipDevMultiplier: true,
});

// Refresh token 30x per menit per IP
export const refreshRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: "Terlalu banyak percobaan refresh token, silakan coba lagi dalam 1 menit",
    skipDevMultiplier: true,
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

// Webhook payment (Midtrans/Xendit) — 60x per menit per IP.
// Pentest fix: webhook punya rate limiter khusus (signature verification
// SHA512 + query DB tetap jalan untuk tiap request sebelum ditolak).
// Midtrans/Xendit retry dengan backoff, jadi burst event tetap aman.
export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Terlalu banyak request webhook, coba lagi sebentar",
  skipDevMultiplier: true,
});
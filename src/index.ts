import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { swaggerSpec } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimit.js";
import routerAuth from "./modules/auth/auth.router.js";
import routerPhoto from "./modules/photo/photo.router.js";
import routerUser from "./modules/users/user.router.js";
import routerCart from "./modules/cart/cart.router.js";
import routerFavorite from "./modules/favorite/favorite.router.js";
import routerOrder from "./modules/order/order.router.js";
import routerPayment from "./modules/payment/payment.router.js";
import routerStats from "./modules/stats/stats.router.js";
import routerDownload from "./modules/downloads/download.router.js";
import routerSubs from "./modules/subscription/subscription.router.js";
import routerPlan from "./modules/plan/plan.router.js";
import routerKeyword from "./modules/keyword/keyword.router.js";
import routerCategory from "./modules/category/category.router.js";
import routerSetting from "./modules/setting/setting.router.js";
import routerPhotographer from "./modules/photographer/photographer.router.js";
import routerEarning from "./modules/earning/earning.router.js";
import routerPayout from "./modules/payout/payout.router.js";
import routerVoucher from "./modules/voucher/voucher.router.js";
import routerEvent from "./modules/event/event.router.js";
import routerLicenseTemplate from "./modules/licenseTemplate/licenseTemplate.router.js";
import routerHomepage from "./modules/homepage/homepage.router.js";
import cron from "node-cron";
import { runSettlement } from "./modules/earning/earning.service.js";

// Error jaringan dari socket yang sudah putus (mis. storage lewat tunnel
// yang mati) kadang dipancarkan di luar rantai promise dan menjatuhkan SELURUH
// API ("write EPIPE" pada TLSSocket). Yang seperti itu cukup dicatat; error
// lain tetap fatal supaya bug sungguhan tidak tersembunyi.
const SOCKET_ERRORS = new Set(["EPIPE", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);
process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err?.code && SOCKET_ERRORS.has(err.code)) {
    console.error(`[net] ${err.code} diabaikan (socket putus):`, err.message);
    return;
  }
  console.error(err);
  process.exit(1);
});

const app = express();

// Di Railway/Vercel/Cloudflare request datang lewat reverse proxy (header
// X-Forwarded-For). Tanpa "trust proxy", req.ip = IP proxy: semua pengunjung
// berbagi satu kuota rate-limit, dan express-rate-limit melempar
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. 1 = percaya satu lapis proxy (Railway).
app.set("trust proxy", 1);

// Body size limits for security
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" })); // Untuk form-data
app.use(cookieParser());

// CORS configuration - use environment variable for allowed origins
// Dinormalkan: spasi, tanda kutip, dan garis miring di akhir dibuang — origin
// browser tidak pernah berakhiran "/", jadi "https://app.vercel.app/" di dashboard
// tidak akan cocok dan seluruh panggilan frontend ditolak.
const corsRejectedLogged = new Set<string>();
const normalizeOrigin = (o: string) => o.trim().replace(/^["']+|["']+$/g, "").replace(/\/+$/, "");
const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map(normalizeOrigin).filter(Boolean) || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5175",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5176",
  "http://localhost:5177",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      // Tolak tanpa melempar error (tanpa stack trace / 500): header CORS tidak
      // dikirim, browser yang memblokir. Origin dicatat SEKALI supaya jelas
      // alamat mana yang perlu ditambahkan ke CORS_ORIGINS.
      if (!corsRejectedLogged.has(origin) && corsRejectedLogged.size < 200) {
        corsRejectedLogged.add(origin);
        console.warn(`[cors] ditolak: ${origin} — tambahkan ke CORS_ORIGINS bila ini alamat milikmu`);
      }
      return callback(null, false);
    },
    credentials: true, // Allow cookies
    exposedHeaders: [
      "Content-Type",
      "Content-Length",
      "ETag",
      "x-amz-version-id",
    ],
    optionsSuccessStatus: 200,
  }),
);

// Configure helmet to allow cross-origin image loading
app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer-when-downgrade" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Add custom headers for media assets (don't override CORS, just add cache control)
app.use((req, res, next) => {
  // Set cache headers for API responses (not media)
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");

  next();
});
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
app.use(generalLimiter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to lakuna foto API",
  });
});

// register dan login
app.use("/api/auth", routerAuth);

// stats
app.use("/api/admin", routerStats);
app.use("/api/stats", routerStats);

// template lisensi PDF custom (admin)
app.use("/api/admin/license-template", routerLicenseTemplate);

// photos
app.use("/api/photos", routerPhoto);

// user /me
app.use("/api/users", routerUser);

// cart
app.use("/api/cart", routerCart);

// favorite
app.use("/api/favorite", routerFavorite);

// order
app.use("/api/order", routerOrder);

// payment
app.use("/api/payment", routerPayment);

// download
app.use("/api/downloads", routerDownload);

// subscription
app.use("/api/subscription", routerSubs);

// plan
app.use("/api/plans", routerPlan);

// setting
app.use("/api/settings", routerSetting);

// homepage (konten hero/manifesto/anjungan/mulai — disimpan di tabel Setting)
app.use("/api/homepage", routerHomepage);

// keyword
app.use("/api/keywords", routerKeyword);

// category
app.use("/api/categories", routerCategory);

// photographer
app.use("/api/photographers", routerPhotographer);

// earning (bagi hasil)
app.use("/api/earnings", routerEarning);

// payout (pencairan)
app.use("/api/payouts", routerPayout);

// voucher (kode diskon)
app.use("/api/vouchers", routerVoucher);

// event (diskon tanpa kode)
app.use("/api/events", routerEvent);

app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Monthly subscription settlement: 1st of each month at 00:05 local time.
cron.schedule("5 0 1 * *", async () => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  try {
    const result = await runSettlement(period);
    console.log(`[SETTLEMENT] done ${period}`, result);
  } catch (err: any) {
    // A concurrent manual trigger / multi-instance cron may race past the
    // in-tx idempotency check and hit the unique constraint on SettlementRun.
    // That's expected, not a failure.
    if (err?.code === "P2002" || err?.statusCode === 409) {
      console.log(`[SETTLEMENT] already settled ${period}`);
    } else {
      console.error(`[SETTLEMENT] error ${period}`, err);
    }
  }
});

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
import cron from "node-cron";
import { runSettlement } from "./modules/earning/earning.service.js";

const app = express();

// Body size limits for security
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" })); // Untuk form-data
app.use(cookieParser());

// CORS configuration - use environment variable for allowed origins
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5175",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
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

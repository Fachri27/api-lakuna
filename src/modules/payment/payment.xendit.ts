import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { verifyXenditCallback, xenditInvoice } from "../../config/xendit.js";
import { AppError } from "../../middlewares/errorHandler.js";

/**
 * Callback Xendit untuk invoice cart (externalId `ORDER-<orderId>`).
 *
 * - Verifikasi keaslian via header `x-callback-token` (verifyXenditCallback).
 * - Order dicari lewat `midtransOrderId = invoice.id` (reuse field, tanpa migrasi DB).
 * - Transisi ke PAID hanya dari status invoice PAID/SETTLED, dengan klaim
 *   atomik `updateMany where status PENDING` sehingga idempoten: hanya
 *   pemenang klaim (count === 1) yang memproses; callback ganda → ALREADY_PAID.
 * - Sengaja TIDAK menduplikasi logika lisensi/cart/earning milik flow Midtrans
 *   — cukup flip status agar order tidak macet PENDING (lihat TODO di bawah).
 */

interface XenditInvoiceCallbackBody {
  id?: unknown;
  external_id?: unknown;
  status?: unknown;
}

const KNOWN_STATUSES = ["PAID", "SETTLED", "PENDING", "EXPIRED"] as const;
type KnownInvoiceStatus = (typeof KNOWN_STATUSES)[number];

function isKnownStatus(value: string): value is KnownInvoiceStatus {
  return (KNOWN_STATUSES as readonly string[]).includes(value);
}

function parseCallbackBody(body: unknown): {
  invoiceId: string;
  externalId: string | null;
  status: KnownInvoiceStatus;
} {
  const payload = (body ?? {}) as XenditInvoiceCallbackBody;

  if (typeof payload.id !== "string" || payload.id.length === 0) {
    throw new AppError(400, "INVALID_CALLBACK", "Field id invoice tidak valid");
  }

  const externalId =
    typeof payload.external_id === "string" ? payload.external_id : null;
  // Order Xendit memakai pola ORDER-* (dibuat di order.service.ts).
  if (externalId !== null && !externalId.startsWith("ORDER-")) {
    throw new AppError(
      400,
      "INVALID_CALLBACK",
      "external_id bukan order Xendit (ORDER-*)",
    );
  }

  if (typeof payload.status !== "string") {
    throw new AppError(400, "INVALID_STATUS", "Status invoice tidak valid");
  }
  const status = payload.status.toUpperCase();
  if (!isKnownStatus(status)) {
    throw new AppError(
      400,
      "INVALID_STATUS",
      `Status invoice tidak valid: ${payload.status}`,
    );
  }

  return { invoiceId: payload.id, externalId, status };
}

/** Konfirmasi best-effort ke Xendit; null bila API tak terjangkau (jangan gagalkan callback). */
async function fetchRemoteStatus(
  invoiceId: string,
): Promise<KnownInvoiceStatus | null> {
  try {
    const invoice = await xenditInvoice.getInvoiceById({ invoiceId });
    const remote =
      typeof invoice.status === "string"
        ? invoice.status.toUpperCase()
        : "";
    return isKnownStatus(remote) ? remote : null;
  } catch (err) {
    console.warn("[XENDIT_CONFIRM_SKIP]", {
      invoiceId,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

export async function xenditCallbackService(
  body: unknown,
  callbackToken: string | undefined,
) {
  // 1. Verifikasi token — callback tanpa token valid langsung ditolak (400).
  if (!verifyXenditCallback(callbackToken)) {
    throw new AppError(
      400,
      "INVALID_CALLBACK_TOKEN",
      "x-callback-token tidak valid",
    );
  }

  // 2. Validasi payload.
  const { invoiceId, externalId } = parseCallbackBody(body);

  // 3. Konfirmasi ke Xendit — pentest fix: gagal-tutup. Klaim status di body
  // callback tidak dipercaya untuk mem-PAY order; status invoice diverifikasi
  // langsung ke Xendit. Bila Xendit tak terjangkau, tolak (503) agar Xendit
  // retry — jangan proses klaim PAID tanpa bukti remote.
  const remoteStatus = await fetchRemoteStatus(invoiceId);

  if (remoteStatus === null) {
    throw new AppError(
      503,
      "XENDIT_UNREACHABLE",
      "Tidak dapat memverifikasi status invoice ke Xendit, coba lagi",
    );
  }

  const isPaid = remoteStatus === "PAID" || remoteStatus === "SETTLED";

  if (isPaid) {
    // Klaim atomik ala handler Midtrans: hanya 1 pemenang saat callback ganda/bersamaan.
    const claimed = await prisma.order.updateMany({
      where: { midtransOrderId: invoiceId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (claimed.count === 1) {
      console.log("[XENDIT_ORDER_PAID]", { invoiceId, externalId });
      // TODO(follow-up): samakan efek samping flow Midtrans bila flow Xendit
      // membutuhkannya — hapus cart item yang ditagihkan + buat lisensi
      // STANDAR (lihat handleOrderWebhook di payment.service.ts). Saat ini
      // sengaja hanya flip status agar order tidak macet PENDING.
      return { status: "ORDER_PAID", invoiceId, externalId };
    }

    const existing = await prisma.order.findFirst({
      where: { midtransOrderId: invoiceId },
    });
    if (!existing) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    }
    if (existing.status === "PAID") {
      return { status: "ALREADY_PAID", invoiceId, externalId };
    }
    throw new AppError(
      409,
      "ORDER_NOT_PENDING",
      `Order sudah berstatus ${existing.status}`,
    );
  }

  // Pentest fix: status invoice dari Xendit (remote) yang menentukan, bukan
  // klaim body callback — hanya order PENDING yang di-EXPIRE.
  if (remoteStatus === "EXPIRED") {
    const expired = await prisma.order.updateMany({
      where: { midtransOrderId: invoiceId, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
    if (expired.count === 1) {
      console.log("[XENDIT_ORDER_EXPIRED]", { invoiceId, externalId });
      return { status: "ORDER_EXPIRED", invoiceId, externalId };
    }
    const existing = await prisma.order.findFirst({
      where: { midtransOrderId: invoiceId },
    });
    if (!existing) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    }
    return { status: "ALREADY_FINAL", invoiceId, externalId };
  }

  // PENDING (atau status lain yang dikenali tapi belum final) → akui tanpa aksi.
  return { status: "IGNORED", invoiceId, externalId };
}

export async function xenditCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const raw = req.body as Record<string, unknown> | undefined;
    console.log("[XENDIT_CALLBACK_RECEIVED]", {
      id: raw?.["id"],
      external_id: raw?.["external_id"],
      status: raw?.["status"],
    });
    const result = await xenditCallbackService(
      req.body,
      req.header("x-callback-token") ?? undefined,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
    return next(err);
  }
}

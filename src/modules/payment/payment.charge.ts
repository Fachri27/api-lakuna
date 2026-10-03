/**
 * Pembayaran custom (Midtrans Core API) — halaman bayar milik Lakuna, bukan
 * halaman Snap Midtrans.
 *
 * Alur:
 *   1. Order/langganan/lisensi Standar dibuat seperti biasa (masih membuat
 *      token Snap sebagai cadangan; Core API tetap menerima order_id itu).
 *   2. Frontend membuka /payment/pay/<orderId> → GET ringkasan tagihan.
 *   3. Pembeli memilih metode → POST charge → Core API mengembalikan nomor
 *      VA / QR / URL 3DS. Instruksi disimpan di Redis supaya halaman bisa
 *      dimuat ulang tanpa menagih ulang.
 *   4. Webhook Midtrans (tidak berubah) melunasi record lewat
 *      midtransOrderId yang tersimpan.
 *
 * Ganti metode: Midtrans menolak charge kedua dengan order_id sama (406), jadi
 * percobaan berikutnya memakai `<base>-2`, `<base>-3`, …; tagihan lama
 * dibatalkan dan ditandai "superseded" agar webhook-nya diabaikan.
 */
import { prisma } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";
import { coreApi } from "../../config/midtrans.js";
import { AppError } from "../../middlewares/errorHandler.js";

export type PayMethod =
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "mandiri_bill"
  | "qris"
  | "gopay"
  | "credit_card";

export const PAY_METHODS: PayMethod[] = [
  "bca_va",
  "bni_va",
  "bri_va",
  "permata_va",
  "mandiri_bill",
  "qris",
  "gopay",
  "credit_card",
];

/** Awalan order_id yang dikenal (sama dengan webhook). */
const BASE_RE = /^(ORDER|STD|SUB|INST)-[A-Za-z0-9-]+$/;
/** Sufiks percobaan ulang: <base>-2, <base>-3, … (maks 2 digit). */
const ATTEMPT_RE = /-(\d{1,2})$/;
const INSTR_TTL = 60 * 60 * 26; // > masa berlaku VA bawaan Midtrans (24 jam)

type Kind = "order" | "standar" | "subscription" | "installment";

export type Payable = {
  kind: Kind;
  base: string;
  /** order_id Midtrans yang sedang aktif untuk record ini. */
  currentId: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  email: string | null;
  name: string | null;
  lines: { label: string; amount: number }[];
  discount: number;
};

export type PayInstructions = {
  chargeId: string;
  method: PayMethod;
  status: string;
  expiresAt: string | null;
  vaNumber?: string;
  bank?: string;
  billKey?: string;
  billerCode?: string;
  qrUrl?: string;
  deeplinkUrl?: string;
  redirectUrl?: string;
};

function nextAttemptId(base: string, currentId: string): string {
  const suffix = currentId.length > base.length ? currentId.slice(base.length) : "";
  const n = ATTEMPT_RE.test(suffix) ? Number(suffix.slice(1)) : 1;
  return `${base}-${n + 1}`;
}

async function userContact(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, username: true } });
  return { email: u?.email ?? null, name: u?.username ?? null };
}

/** Cari tagihan milik user dari order_id dasar (tanpa sufiks percobaan). */
export async function resolvePayable(base: string, userId: string): Promise<Payable> {
  if (!BASE_RE.test(base)) throw new AppError(400, "INVALID_ORDER_ID", "Nomor order tidak valid");
  const contact = await userContact(userId);

  if (base.startsWith("ORDER-")) {
    const order = await prisma.order.findFirst({
      where: { id: base.slice("ORDER-".length), userId },
      include: { items: { include: { photo: { select: { title: true } } } } },
    });
    if (!order || !order.midtransOrderId) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    return {
      kind: "order",
      base,
      currentId: order.midtransOrderId,
      amount: order.total,
      status: order.status === "PAID" ? "PAID" : order.status === "PENDING" ? "PENDING" : "CANCELLED",
      ...contact,
      lines: order.items
        .filter((i) => i.price > 0)
        .map((i) => ({ label: i.photo?.title || "Foto", amount: i.price })),
      discount: order.discountAmount ?? 0,
    };
  }

  if (base.startsWith("STD-")) {
    const order = await prisma.order.findFirst({
      where: { userId, midtransOrderId: { startsWith: base } },
    });
    if (!order || !order.midtransOrderId) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    return {
      kind: "standar",
      base,
      currentId: order.midtransOrderId,
      amount: order.total,
      status: order.status === "PAID" ? "PAID" : order.status === "PENDING" ? "PENDING" : "CANCELLED",
      ...contact,
      lines: [{ label: "Standar licence", amount: order.total + (order.discountAmount ?? 0) }],
      discount: order.discountAmount ?? 0,
    };
  }

  if (base.startsWith("SUB-")) {
    const sub = await prisma.subscription.findFirst({
      where: { userId, midtransOrderId: { startsWith: base } },
      include: { plan: { select: { quota: true } } },
    });
    if (!sub || !sub.midtransOrderId) throw new AppError(404, "SUBSCRIPTION_NOT_FOUND", "Langganan tidak ditemukan");
    return {
      kind: "subscription",
      base,
      currentId: sub.midtransOrderId,
      amount: Math.max(0, sub.price - (sub.discountAmount ?? 0)),
      status: sub.status === "ACTIVE" ? "PAID" : sub.status === "PENDING" ? "PENDING" : "CANCELLED",
      ...contact,
      lines: [{ label: `Subscription · ${sub.plan?.quota ?? sub.quota} downloads / month`, amount: sub.price }],
      discount: sub.discountAmount ?? 0,
    };
  }

  // INST-: beberapa cicilan dilunasi bersama, berbagi satu midtransOrderId.
  const insts = await prisma.billingInstallment.findMany({
    where: { midtransOrderId: { startsWith: base }, Subscription: { userId } },
    orderBy: { monthNumber: "asc" },
  });
  if (!insts.length || !insts[0]!.midtransOrderId) {
    throw new AppError(404, "INSTALLMENT_NOT_FOUND", "Tagihan cicilan tidak ditemukan");
  }
  const amount = insts.reduce((s, i) => s + i.amount, 0);
  return {
    kind: "installment",
    base,
    currentId: insts[0]!.midtransOrderId,
    amount,
    status: insts.every((i) => i.status === "PAID") ? "PAID" : "PENDING",
    ...contact,
    lines: insts.map((i) => ({ label: `Installment · month ${i.monthNumber}`, amount: i.amount })),
    discount: 0,
  };
}

async function setCurrentId(p: Payable, userId: string, chargeId: string) {
  if (p.kind === "order" || p.kind === "standar") {
    await prisma.order.updateMany({ where: { userId, midtransOrderId: p.currentId }, data: { midtransOrderId: chargeId } });
  } else if (p.kind === "subscription") {
    await prisma.subscription.updateMany({ where: { userId, midtransOrderId: p.currentId }, data: { midtransOrderId: chargeId } });
  } else {
    await prisma.billingInstallment.updateMany({ where: { midtransOrderId: p.currentId }, data: { midtransOrderId: chargeId } });
  }
}

const instrKey = (base: string) => `pay:instr:${base}`;
const supersededKey = (id: string) => `pay:superseded:${id}`;

/** Webhook dari tagihan yang sudah diganti metode lain → abaikan. */
export async function isSupersededCharge(orderId: string): Promise<boolean> {
  try {
    return (await redisClient.exists(supersededKey(orderId))) === 1;
  } catch {
    return false;
  }
}

async function readInstructions(base: string): Promise<PayInstructions | null> {
  try {
    const raw = await redisClient.get(instrKey(base));
    return raw ? (JSON.parse(raw) as PayInstructions) : null;
  } catch {
    return null;
  }
}

function actionUrl(actions: any[] | undefined, name: string): string | undefined {
  return actions?.find((a) => a?.name === name)?.url;
}

function normalize(method: PayMethod, chargeId: string, r: any): PayInstructions {
  const out: PayInstructions = {
    chargeId,
    method,
    status: r.transaction_status ?? "pending",
    expiresAt: r.expiry_time ? new Date(r.expiry_time.replace(" ", "T") + "+07:00").toISOString() : null,
  };
  if (r.va_numbers?.[0]) {
    out.vaNumber = r.va_numbers[0].va_number;
    out.bank = r.va_numbers[0].bank;
  }
  if (r.permata_va_number) {
    out.vaNumber = r.permata_va_number;
    out.bank = "permata";
  }
  if (r.bill_key) {
    out.billKey = r.bill_key;
    out.billerCode = r.biller_code;
    out.bank = "mandiri";
  }
  const qr = actionUrl(r.actions, "generate-qr-code");
  if (qr) out.qrUrl = qr;
  const deeplink = actionUrl(r.actions, "deeplink-redirect");
  if (deeplink) out.deeplinkUrl = deeplink;
  if (r.redirect_url) out.redirectUrl = r.redirect_url;
  return out;
}

function chargeParams(method: PayMethod, chargeId: string, p: Payable, cardToken?: string) {
  const base: any = {
    transaction_details: { order_id: chargeId, gross_amount: p.amount },
    customer_details: { email: p.email ?? undefined, first_name: p.name ?? undefined },
  };
  switch (method) {
    case "bca_va":
    case "bni_va":
    case "bri_va":
      return { ...base, payment_type: "bank_transfer", bank_transfer: { bank: method.slice(0, 3) } };
    case "permata_va":
      return { ...base, payment_type: "bank_transfer", bank_transfer: { bank: "permata" } };
    case "mandiri_bill":
      return { ...base, payment_type: "echannel", echannel: { bill_info1: "Lakuna Stock", bill_info2: p.base.slice(0, 30) } };
    case "qris":
      return { ...base, payment_type: "qris" };
    case "gopay":
      return { ...base, payment_type: "gopay", gopay: { enable_callback: true, callback_url: `${process.env.FRONTEND_URL}/payment/finish?order_id=${encodeURIComponent(p.base)}` } };
    case "credit_card":
      if (!cardToken) throw new AppError(400, "CARD_TOKEN_REQUIRED", "Token kartu wajib diisi");
      return { ...base, payment_type: "credit_card", credit_card: { token_id: cardToken, authentication: true } };
  }
}

async function remoteStatus(id: string): Promise<string | null> {
  try {
    const s = await (coreApi as any).transaction.status(id);
    return s?.transaction_status ?? null;
  } catch {
    return null; // 404 = belum pernah di-charge (atau Midtrans tak terjangkau)
  }
}

/** Ringkasan tagihan + instruksi aktif (bila sudah memilih metode). */
export async function getPayment(base: string, userId: string) {
  const p = await resolvePayable(base, userId);
  const instr = await readInstructions(base);
  return {
    orderId: base,
    kind: p.kind,
    status: p.status,
    amount: p.amount,
    discount: p.discount,
    lines: p.lines,
    methods: PAY_METHODS,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    // Instruksi lama hanya ditampilkan bila masih milik tagihan aktif.
    instructions: instr && instr.chargeId === p.currentId ? instr : null,
  };
}

/** Tagih dengan metode terpilih (atau ganti metode). */
export async function chargePayment(base: string, userId: string, method: PayMethod, cardToken?: string) {
  if (!PAY_METHODS.includes(method)) throw new AppError(400, "INVALID_METHOD", "Metode pembayaran tidak dikenal");
  const p = await resolvePayable(base, userId);
  if (p.status !== "PENDING") throw new AppError(409, "NOT_PAYABLE", "Tagihan ini sudah tidak menunggu pembayaran");
  if (p.amount <= 0) throw new AppError(400, "ZERO_AMOUNT", "Tagihan Rp0 tidak perlu dibayar");

  // order_id aktif sudah pernah di-charge? → percobaan baru dengan sufiks.
  let chargeId = p.currentId;
  const prevStatus = await remoteStatus(p.currentId);
  if (prevStatus === "settlement" || prevStatus === "capture") {
    throw new AppError(409, "ALREADY_PAID", "Pembayaran sudah diterima");
  }
  if (prevStatus) {
    chargeId = nextAttemptId(base, p.currentId);
    if (chargeId.length > 50) throw new AppError(400, "TOO_MANY_ATTEMPTS", "Terlalu sering mengganti metode pembayaran");
    if (prevStatus === "pending") {
      await (coreApi as any).transaction.cancel(p.currentId).catch(() => {});
    }
    await redisClient.set(supersededKey(p.currentId), "1", "EX", 60 * 60 * 24 * 3).catch(() => {});
  }

  let res: any;
  try {
    res = await (coreApi as any).charge(chargeParams(method, chargeId, p, cardToken));
  } catch (err: any) {
    const api = err?.ApiResponse;
    const msg = api?.status_message || "Midtrans menolak pembayaran";
    const code = String(api?.status_code ?? "");
    throw new AppError(code === "402" ? 400 : 502, code === "402" ? "METHOD_UNAVAILABLE" : "CHARGE_FAILED", msg);
  }
  if (!res || !/^20[01]$/.test(String(res.status_code))) {
    throw new AppError(502, "CHARGE_FAILED", res?.status_message || "Midtrans menolak pembayaran");
  }

  if (chargeId !== p.currentId) await setCurrentId(p, userId, chargeId);
  const instr = normalize(method, chargeId, res);
  await redisClient.set(instrKey(base), JSON.stringify(instr), "EX", INSTR_TTL).catch(() => {});
  return instr;
}

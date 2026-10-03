import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/errorHandler.js";

// ── tipe hasil kalkulasi ──
export interface DiscountCandidate {
  source: "VOUCHER" | "EVENT";
  amount: number; // nominal diskon (rupiah)
  voucherId?: string;
  eventId?: string;
  eventName?: string;
  voucherCode?: string;
}

export interface AppliedDiscount {
  amount: number;
  source: "VOUCHER" | "EVENT" | "NONE";
  voucherId?: string;
  voucherCode?: string;
  eventId?: string;
  eventName?: string;
  candidates: DiscountCandidate[]; // semua kandidat ( transparansi )
}

// ── helper: konversi value (persen/nominal) → nominal diskon ──
export function computeDiscountAmount(
  valueType: "PERCENT" | "NOMINAL",
  value: number,
  baseAmount: number,
  maxDiscount?: number | null,
): number {
  if (baseAmount <= 0) return 0;
  let cut: number;
  if (valueType === "PERCENT") {
    cut = Math.floor((baseAmount * value) / 100);
    if (maxDiscount != null && cut > maxDiscount) cut = maxDiscount;
  } else {
    cut = Math.min(value, baseAmount);
  }
  if (cut < 0) cut = 0;
  return cut;
}

// ── ambil kandidat terbesar (aturuan: tidak ditumpuk) ──
export function pickBest(candidates: DiscountCandidate[]): AppliedDiscount {
  const sorted = [...candidates].sort((a, b) => b.amount - a.amount);
  const best = sorted[0];
  if (!best || best.amount <= 0) {
    return { amount: 0, source: "NONE", candidates };
  }
  const result: AppliedDiscount = { amount: best.amount, source: best.source, candidates };
  if (best.voucherId !== undefined) result.voucherId = best.voucherId;
  if (best.voucherCode !== undefined) result.voucherCode = best.voucherCode;
  if (best.eventId !== undefined) result.eventId = best.eventId;
  if (best.eventName !== undefined) result.eventName = best.eventName;
  return result;
}

// ── validasi voucher terhadap konteks pembayaran ──
export async function validateVoucher(ctx: {
  code: string;
  scope: "ORDER" | "SUBSCRIPTION";
  userId: string;
  amount: number; // total sebelum diskon
  tx?: Prisma.TransactionClient;
}): Promise<{
  valid: boolean;
  reason?: string;
  voucher?: {
    id: string;
    code: string;
    scope: string;
    valueType: "PERCENT" | "NOMINAL";
    value: number;
    maxDiscount: number | null;
    minSpend: number | null;
    endsAt: Date;
  };
  discountAmount: number;
}> {
  const db = ctx.tx ?? prisma;
  const code = ctx.code.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Kode kosong", discountAmount: 0 };

  const voucher = await db.voucher.findUnique({ where: { code } });
  if (!voucher) return { valid: false, reason: "Voucher tidak ditemukan", discountAmount: 0 };
  if (!voucher.isActive) return { valid: false, reason: "Voucher nonaktif", discountAmount: 0 };

  const now = new Date();
  if (now < voucher.startsAt) return { valid: false, reason: "Voucher belum berlaku", discountAmount: 0 };
  if (now > voucher.endsAt) return { valid: false, reason: "Voucher sudah berakhir", discountAmount: 0 };

  if (voucher.scope !== "BOTH" && voucher.scope !== ctx.scope) {
    return { valid: false, reason: "Voucher tidak berlaku untuk transaksi ini", discountAmount: 0 };
  }
  if (voucher.minSpend != null && ctx.amount < voucher.minSpend) {
    return { valid: false, reason: `Min. belanja ${voucher.minSpend}`, discountAmount: 0 };
  }
  if (voucher.quotaTotal != null && voucher.usedCount >= voucher.quotaTotal) {
    return { valid: false, reason: "Kuota voucher habis", discountAmount: 0 };
  }

  // batas per-user (dari redemption yang sudah tercatat)
  const usedByUser = await db.voucherRedemption.count({
    where: { voucherId: voucher.id, userId: ctx.userId },
  });
  if (usedByUser >= voucher.quotaPerUser) {
    return { valid: false, reason: "Batas pemakaian per-user tercapai", discountAmount: 0 };
  }

  const discountAmount = computeDiscountAmount(
    voucher.valueType,
    voucher.value,
    ctx.amount,
    voucher.maxDiscount,
  );

  return {
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      scope: voucher.scope,
      valueType: voucher.valueType,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount,
      minSpend: voucher.minSpend,
      endsAt: voucher.endsAt,
    },
    discountAmount,
  };
}

// ── event aktif yang menargetkan foto tertentu ──
// Mengembalikan map: photoId → kandidat event terbaik untuk foto itu.
export async function getActiveEventCandidatesForPhotos(
  photoIds: string[],
  photoPrices: Record<string, number>,
  tx?: Prisma.TransactionClient,
): Promise<Record<string, DiscountCandidate>> {
  const db = tx ?? prisma;
  const now = new Date();
  const result: Record<string, DiscountCandidate> = {};

  if (photoIds.length === 0) return result;

  const eventPhotos = await db.eventPhoto.findMany({
    where: { photoId: { in: photoIds } },
    include: { event: true },
  });

  for (const ep of eventPhotos) {
    const event = ep.event;
    if (!event.isActive) continue;
    if (now < event.startsAt || now > event.endsAt) continue;
    const base = photoPrices[ep.photoId] ?? 0;
    const amount = computeDiscountAmount(event.valueType, event.value, base, event.maxDiscount);
    if (amount <= 0) continue;
    const existing = result[ep.photoId];
    if (!existing || amount > existing.amount) {
      result[ep.photoId] = {
        source: "EVENT",
        amount,
        eventId: event.id,
        eventName: event.name,
      };
    }
  }
  return result;
}

// ── event aktif yang menargetkan plan tertentu ──
export async function getActiveEventCandidateForPlan(
  planId: string,
  planPrice: number,
  tx?: Prisma.TransactionClient,
): Promise<DiscountCandidate | null> {
  const db = tx ?? prisma;
  const now = new Date();
  const eventPlans = await db.eventPlan.findMany({
    where: { planId },
    include: { event: true },
  });

  let best: DiscountCandidate | null = null;
  for (const epl of eventPlans) {
    const event = epl.event;
    if (!event.isActive) continue;
    if (now < event.startsAt || now > event.endsAt) continue;
    const amount = computeDiscountAmount(event.valueType, event.value, planPrice, event.maxDiscount);
    if (amount <= 0) continue;
    if (!best || amount > best.amount) {
      best = { source: "EVENT", amount, eventId: event.id, eventName: event.name };
    }
  }
  return best;
}

// ── catat VoucherRedemption idempoten saat transaksi PAID ──
// Dipanggil di dalam transaction payment webhook. Tidak membuat duplikat
// bila webhook/polling menandai order yang sama PAID dua kali.
export async function recordVoucherRedemption(
  tx: Prisma.TransactionClient,
  ctx: {
    voucherId: string;
    userId: string;
    amountCut: number;
    orderId?: string;
    subscriptionId?: string;
  },
): Promise<void> {
  // Wajib terikat ke satu transaksi (order atau subscription) agar
  // idempotency check di bawah bermakna. Tanpa salah satunya, `where`
  // hanya berisi voucherId dan bisa cocok dengan redemption milik
  // transaksi lain sehingga pencatatan ter-skip secara keliru.
  if (!ctx.orderId && !ctx.subscriptionId) {
    throw new Error("recordVoucherRedemption membutuhkan orderId atau subscriptionId");
  }

  // sudah ada redemption untuk transaksi ini? (idempoten — aman dipanggil
  // ulang oleh webhook/polling untuk transaksi yang sama)
  const existing = await tx.voucherRedemption.findFirst({
    where: {
      voucherId: ctx.voucherId,
      ...(ctx.orderId ? { orderId: ctx.orderId } : {}),
      ...(ctx.subscriptionId ? { subscriptionId: ctx.subscriptionId } : {}),
    },
  });
  if (existing) return;

  await tx.voucherRedemption.create({
    data: {
      voucherId: ctx.voucherId,
      userId: ctx.userId,
      amountCut: ctx.amountCut,
      orderId: ctx.orderId ?? null,
      subscriptionId: ctx.subscriptionId ?? null,
    },
  });
  await tx.voucher.update({
    where: { id: ctx.voucherId },
    data: { usedCount: { increment: 1 } },
  });
}

// ── klaim kuota voucher atomik (pentest tahap-2 fix) ──
// Sebelumnya cek kuota bersifat read-then-write (TOCTOU): dua request
// konkuren sama-sama lolos validateVoucher sebelum salah satu commit.
// Sekarang, di dalam tx PEMANGGIL (tanpa network call Midtrans di tx yang
// sama):
// 1. klaim kuota total via updateMany bersyarat → row lock pada baris
//    voucher menserialisasi semua klaim konkuren untuk voucher yang sama;
// 2. hitung pemakaian per-user SETELAH lock, dengan locking read (FOR
//    UPDATE) agar membaca versi ter-commit (bukan snapshot REPEATABLE READ
//    yang bisa kedaluwarsa) → TOCTOU per-user tertutup;
// 3. baru insert redemption row.
// Bila kuota habis → AppError 400 bersih (bukan 500 mentah P2034).
export async function claimVoucherQuota(
  tx: Prisma.TransactionClient,
  ctx: {
    voucherId: string;
    userId: string;
    amountCut: number;
    orderId?: string;
    subscriptionId?: string;
  },
): Promise<void> {
  if (!ctx.orderId && !ctx.subscriptionId) {
    throw new Error("claimVoucherQuota membutuhkan orderId atau subscriptionId");
  }

  // idempoten untuk pemanggil ulang (webhook/polling) untuk transaksi yang sama
  const existing = await tx.voucherRedemption.findFirst({
    where: {
      voucherId: ctx.voucherId,
      ...(ctx.orderId ? { orderId: ctx.orderId } : {}),
      ...(ctx.subscriptionId ? { subscriptionId: ctx.subscriptionId } : {}),
    },
  });
  if (existing) return;

  const voucher = await tx.voucher.findUnique({
    where: { id: ctx.voucherId },
  });
  if (!voucher) {
    throw new AppError(404, "VOUCHER_NOT_FOUND", "Voucher tidak ditemukan");
  }

  // 1) klaim kuota total atomik — kondisi di WHERE yang menolak, bukan cek
  // baca-tulis. quotaTotal null = tak terbatas (tetap ambil lock untuk
  // menserialisasi cek per-user di bawah).
  const claimWhere: Prisma.VoucherWhereInput = {
    id: ctx.voucherId,
    isActive: true,
  };
  if (voucher.quotaTotal != null) {
    claimWhere.usedCount = { lt: voucher.quotaTotal };
  }
  const claim = await tx.voucher.updateMany({
    where: claimWhere,
    data: { usedCount: { increment: 1 } },
  });
  if (claim.count === 0) {
    throw new AppError(
      400,
      "VOUCHER_QUOTA_EXHAUSTED",
      "Kuota voucher sudah habis",
    );
  }

  // 2) per-user SETELAH lock. Locking read (FOR UPDATE) lewat raw query
  // agar membaca commit terbaru — menserialisasi dengan klaim konkuren
  // lain untuk voucher yang sama (mereka menunggu row lock yang sama).
  const rows = await tx.$queryRaw<Array<{ cnt: number | bigint }>>`
    SELECT COUNT(*) AS cnt FROM \`VoucherRedemption\`
    WHERE voucherId = ${ctx.voucherId} AND userId = ${ctx.userId}
    FOR UPDATE
  `;
  const usedByUser = Number(rows[0]?.cnt ?? 0);
  if (usedByUser >= voucher.quotaPerUser) {
    // throw → rollback tx pemanggil (increment ikut ter-rollback)
    throw new AppError(
      400,
      "VOUCHER_USER_QUOTA_EXHAUSTED",
      "Batas pemakaian voucher per-user tercapai",
    );
  }

  // 3) redemption row
  await tx.voucherRedemption.create({
    data: {
      voucherId: ctx.voucherId,
      userId: ctx.userId,
      amountCut: ctx.amountCut,
      orderId: ctx.orderId ?? null,
      subscriptionId: ctx.subscriptionId ?? null,
    },
  });
}

// ── pengembalian kuota voucher (pentest tahap-2 fix) ──
// Dipanggil saat order/subscription batal/expire atau saat pembuatan token
// Midtrans gagal (kompensasi): redemption row dihapus + usedCount
// dikurangi, dalam tx PEMANGGIL. Tanpa ini, order PENDING yang tidak
// pernah dibayar menguras kuota voucher permanen.
export async function releaseVoucherQuota(
  tx: Prisma.TransactionClient,
  ctx: { orderId?: string; subscriptionId?: string },
): Promise<boolean> {
  if (!ctx.orderId && !ctx.subscriptionId) return false;
  const redemption = await tx.voucherRedemption.findFirst({
    where: {
      ...(ctx.orderId ? { orderId: ctx.orderId } : {}),
      ...(ctx.subscriptionId ? { subscriptionId: ctx.subscriptionId } : {}),
    },
  });
  if (!redemption) return false;
  await tx.voucherRedemption.delete({
    where: { id: redemption.id },
  });
  await tx.voucher.update({
    where: { id: redemption.voucherId },
    data: { usedCount: { decrement: 1 } },
  });
  return true;
}
// Menerima optional voucherCode. Mengembalikan diskon final (ambil terbesar
// antara voucher vs jumlah event per-item), sumber, dan rincian.
export async function computeOrderDiscount(ctx: {
  userId: string;
  items: Array<{ photoId: string; price: number; license: string }>;
  voucherCode?: string | undefined;
  tx?: Prisma.TransactionClient;
}): Promise<AppliedDiscount> {
  const db = ctx.tx ?? prisma;
  // hanya item STANDAR yang berbayar dan dapat diskon event (per foto)
  const standarItems = ctx.items.filter((i) => i.license === "STANDAR" && i.price > 0);
  const totalBase = standarItems.reduce((s, i) => s + i.price, 0);

  const candidates: DiscountCandidate[] = [];

  // 1) event per-foto
  if (standarItems.length > 0) {
    const prices: Record<string, number> = {};
    for (const i of standarItems) prices[i.photoId] = i.price;
    const perPhoto = await getActiveEventCandidatesForPhotos(
      standarItems.map((i) => i.photoId),
      prices,
      db,
    );
    let eventSum = 0;
    for (const id of Object.keys(perPhoto)) {
      const c = perPhoto[id];
      if (c) eventSum += c.amount;
    }
    if (eventSum > 0) {
      // representasi sebagai satu kandidat "event" (gabungan) agar bisa
      // dibandingkan dengan voucher pada level order
      candidates.push({
        source: "EVENT",
        amount: eventSum,
        eventName: "Event diskon",
      });
    }
  }

  // 2) voucher (atas total order)
  if (ctx.voucherCode && totalBase > 0) {
    const v = await validateVoucher({
      code: ctx.voucherCode,
      scope: "ORDER",
      userId: ctx.userId,
      amount: totalBase,
      tx: db,
    });
    if (v.valid && v.voucher && v.discountAmount > 0) {
      candidates.push({
        source: "VOUCHER",
        amount: v.discountAmount,
        voucherId: v.voucher.id,
        voucherCode: v.voucher.code,
      });
    }
  }

  return pickBest(candidates);
}

// ── kalkulasi diskon untuk SUBSCRIPTION (upfront) ──
export async function computeSubscriptionDiscount(ctx: {
  userId: string;
  planId: string;
  planPrice: number;
  voucherCode?: string | undefined;
  tx?: Prisma.TransactionClient;
}): Promise<AppliedDiscount> {
  const db = ctx.tx ?? prisma;
  const candidates: DiscountCandidate[] = [];

  // 1) event dengan targetType PLAN
  const ev = await getActiveEventCandidateForPlan(ctx.planId, ctx.planPrice, db);
  if (ev && ev.amount > 0) candidates.push(ev);

  // 2) voucher scope SUBSCRIPTION/BOTH
  if (ctx.voucherCode && ctx.planPrice > 0) {
    const v = await validateVoucher({
      code: ctx.voucherCode,
      scope: "SUBSCRIPTION",
      userId: ctx.userId,
      amount: ctx.planPrice,
      tx: db,
    });
    if (v.valid && v.voucher && v.discountAmount > 0) {
      candidates.push({
        source: "VOUCHER",
        amount: v.discountAmount,
        voucherId: v.voucher.id,
        voucherCode: v.voucher.code,
      });
    }
  }

  return pickBest(candidates);
}
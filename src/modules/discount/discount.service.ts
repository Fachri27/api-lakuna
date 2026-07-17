import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";

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
  // sudah ada redemption untuk transaksi ini?
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
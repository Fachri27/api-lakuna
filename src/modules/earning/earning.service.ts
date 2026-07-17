import { prisma } from "../../config/db.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getSettingService } from "../setting/setting.service.js";
import {
  computeStandarShare,
  computeSubscriptionDistribution,
} from "./earning.math.js";

// Read the global contributor share percentage, with safe fallback.
export async function getContributorSharePct(): Promise<number> {
  const s = await getSettingService("contributor_share_percentage");
  const n = Number(s?.value ?? "70");
  if (!Number.isFinite(n) || n < 0 || n > 100) return 70;
  return Math.floor(n);
}

/**
 * Create Earning rows for STANDAR OrderItems inside an existing transaction.
 * Idempotent: skips items that already have an Earning for (orderId, photoId, STANDAR).
 * Only photos owned by a CONTRIBUTOR earn; others are full platform revenue.
 *
 * `tx`  — the Prisma transaction client.
 * `items` — the order's OrderItem[] (must include licenseType, photoId, price).
 */
export async function recordStandarEarnings(
  tx: any,
  orderId: string,
  items: Array<{ licenseType: string; photoId: string; price: number }>,
): Promise<void> {
  const standarItems = items.filter((i) => i.licenseType === "STANDAR");
  if (standarItems.length === 0) return;

  const pct = await getContributorSharePct();

  const photos = await tx.photo.findMany({
    where: { id: { in: standarItems.map((i) => i.photoId) }, deletedAt: null },
    include: { user: { select: { id: true, role: true } } },
  });
  const photosById: Map<string, any> = new Map(photos.map((p: any) => [p.id, p]));

  for (const item of standarItems) {
    // Idempotency guard (fast path). The DB unique constraint is the race safety net.
    const existing = await tx.earning.findFirst({
      where: { orderId, photoId: item.photoId, source: "STANDAR" },
    });
    if (existing) continue;

    const photo = photosById.get(item.photoId);
    if (!photo || photo.user?.role !== "CONTRIBUTOR") continue;

    const share = computeStandarShare(item.price, pct);
    if (share <= 0) continue;

    const contributorId = photo.user.id;
    try {
      await tx.earning.create({
        data: {
          contributorId,
          photoId: item.photoId,
          source: "STANDAR",
          amount: share,
          orderId,
        },
      });
    } catch (err: any) {
      // Race safety net: a concurrent webhook + polling both marked the order
      // PAID. The DB unique constraint (orderId, photoId, source) makes the
      // loser throw P2002 — treat it as already recorded and move on instead
      // of surfacing a 409 to the caller.
      if (err?.code === "P2002") continue;
      throw err;
    }
    await tx.contributorBalance.upsert({
      where: { contributorId },
      create: { contributorId, pending: share, lifetimeEarned: share },
      update: {
        pending: { increment: share },
        lifetimeEarned: { increment: share },
      },
    });
  }
}

/**
 * Run the monthly subscription settlement for a "YYYY-MM" period.
 * Atomic + idempotent: reads and writes all run inside one $transaction so
 * the snapshot and the ledger writes are consistent, and a SettlementRun row
 * is written last. Re-running a settled period throws 409.
 */
export async function runSettlement(period: string, ranBy?: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) throw new AppError(400, "INVALID_PERIOD", "Period harus YYYY-MM");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // exclusive

  return prisma.$transaction(async (tx) => {
    // Re-check idempotency inside the transaction (race safety).
    const already = await tx.settlementRun.findUnique({ where: { period } });
    if (already) {
      throw new AppError(409, "ALREADY_SETTLED", `Settlement ${period} sudah dijalankan`);
    }

    // 1. Recognized subscription pool: sum of price / termMonths for subs
    //    active (overlapping) during the period.
    const subs = await tx.subscription.findMany({
      where: {
        status: "ACTIVE",
        startedAt: { lt: end },
        expiresAt: { gt: start },
      },
    });
    const pool = subs.reduce((sum, s) => {
      const termMonths = s.billing === "annual" ? 12 : 1;
      return sum + Math.floor(s.price / termMonths);
    }, 0);

    const pct = await getContributorSharePct();

    // 2. SUBSCRIBE downloads in the period, grouped by photo owner (contributor).
    //    Past downloads still count even if the photo was later soft-deleted —
    //    the contributor earned that share while the photo was active.
    const downloads = await tx.download.findMany({
      where: {
        downloadedAt: { gte: start, lt: end },
        license: { type: "SUBSCRIBE" },
        photo: { user: { role: "CONTRIBUTOR" } },
      },
      include: { photo: { select: { userId: true } } },
    });
    const counts = new Map<string, number>();
    for (const d of downloads) {
      const cid = d.photo.userId;
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }

    const distribution = computeSubscriptionDistribution(pool, counts, pct);

    // 3. Atomic write. Skip zero-amount rows so the ledger only records
    //    earnings that actually moved money (matches recordStandarEarnings).
    let totalDistributed = 0;
    let contributorsPaid = 0;
    for (const { contributorId, amount } of distribution) {
      if (amount <= 0) continue;
      await tx.earning.create({
        data: {
          contributorId,
          source: "SUBSCRIPTION",
          amount,
          period,
          photoId: null,
        },
      });
      await tx.contributorBalance.upsert({
        where: { contributorId },
        create: { contributorId, pending: amount, lifetimeEarned: amount },
        update: {
          pending: { increment: amount },
          lifetimeEarned: { increment: amount },
        },
      });
      totalDistributed += amount;
      contributorsPaid += 1;
    }

    await tx.settlementRun.create({
      data: { period, totalPool: pool, totalDistributed, ranBy: ranBy ?? null },
    });

    return { period, totalPool: pool, totalDistributed, contributors: contributorsPaid };
  });
}

// ─── read helpers ───────────────────────

export async function getMyEarnings(contributorId: string, query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const where: any = { contributorId };
  if (query.source) where.source = String(query.source).toUpperCase();
  if (query.period) where.period = String(query.period);

  const [data, total] = await Promise.all([
    prisma.earning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { photo: { select: { id: true, title: true } } },
    }),
    prisma.earning.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
}

export async function getMySummary(contributorId: string) {
  const balance = await prisma.contributorBalance.findUnique({
    where: { contributorId },
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = await prisma.earning.aggregate({
    where: { contributorId, createdAt: { gte: monthStart } },
    _sum: { amount: true },
  });
  return {
    pending: balance?.pending ?? 0,
    paidOut: balance?.paidOut ?? 0,
    lifetimeEarned: balance?.lifetimeEarned ?? 0,
    thisMonth: thisMonth._sum.amount ?? 0,
  };
}

export async function listAllEarnings(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const where: any = {};
  if (query.contributorId) where.contributorId = String(query.contributorId);
  if (query.source) where.source = String(query.source).toUpperCase();
  if (query.period) where.period = String(query.period);

  const [data, total] = await Promise.all([
    prisma.earning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contributor: { select: { id: true, email: true, realName: true } },
        photo: { select: { id: true, title: true } },
      },
    }),
    prisma.earning.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
}
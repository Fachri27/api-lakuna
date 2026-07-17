import { prisma } from "../../config/db.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { runSettlement } from "../earning/earning.service.js";

/**
 * Record a manual admin payout. Single-step COMPLETED in v1.
 * Validates amount > 0 and amount <= contributor's pending balance.
 */
export async function createPayoutService(
  data: {
    contributorId: string;
    amount: number;
    method: string;
    reference?: string;
    note?: string;
  },
  processedBy: string,
) {
  const amount = Math.floor(Number(data.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, "INVALID_AMOUNT", "Amount harus lebih dari 0");
  }

  return prisma.$transaction(async (tx) => {
    // Atomic balance check + debit. A conditional updateMany is the race-safe
    // way to "decrement iff pending >= amount": the WHERE clause filters out
    // insufficient (or missing) balances, and count===0 means we reject.
    // This avoids the read-then-write window that two concurrent payouts could
    // both pass, double-paying the contributor and driving pending negative.
    const debited = await tx.contributorBalance.updateMany({
      where: { contributorId: data.contributorId, pending: { gte: amount } },
      data: {
        pending: { decrement: amount },
        paidOut: { increment: amount },
      },
    });
    if (debited.count === 0) {
      throw new AppError(400, "INSUFFICIENT_BALANCE", "Saldo kontributor tidak cukup");
    }

    const payout = await tx.payout.create({
      data: {
        contributorId: data.contributorId,
        amount,
        method: data.method,
        reference: data.reference ?? null,
        note: data.note ?? null,
        status: "COMPLETED",
        processedBy,
        processedAt: new Date(),
      },
    });

    return payout;
  });
}

export async function listPayouts(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const where: any = {};
  if (query.contributorId) where.contributorId = String(query.contributorId);

  const [data, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contributor: { select: { id: true, email: true, realName: true } },
      },
    }),
    prisma.payout.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
}

export async function listMinePayouts(contributorId: string, query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const where = { contributorId };

  const [data, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payout.count({ where }),
  ]);
  return { data, meta: { page, limit, total } };
}

export async function listContributorsWithBalance() {
  const users = await prisma.user.findMany({
    where: { role: "CONTRIBUTOR", deletedAt: null },
    include: { contributorBalance: true },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    realName: u.realName,
    pending: u.contributorBalance?.pending ?? 0,
    paidOut: u.contributorBalance?.paidOut ?? 0,
    lifetimeEarned: u.contributorBalance?.lifetimeEarned ?? 0,
  }));
}

export async function listSettlements() {
  return prisma.settlementRun.findMany({
    orderBy: { period: "desc" },
  });
}

// Re-export so the payout controller can expose it without a cross-module import.
export { runSettlement };
import { prisma } from "../../config/db.js";
import { AppError } from "../../middlewares/errorHandler.js";

export async function getAllPlansService() {
  return await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { quota: "asc" },
  });
}

export async function createPlanService(data: {
  quota: number;
  priceMonthly: number;
  priceAnnual: number;
}) {
  const existing = await prisma.plan.findFirst({
    where: { quota: data.quota, isActive: true },
  });

  if (existing) {
    throw new AppError(409, "PLAN_EXISTS", "Plan dengan quota ini sudah ada");
  }

  return await prisma.plan.create({ data });
}

export async function updatePlanService(
  id: string,
  data: {
    quota?: number;
    priceMonthly?: number;
    priceAnnual?: number;
    isActive?: boolean;
  },
) {
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan) {
    throw new AppError(404, "PLAN_NOT_FOUND", "Plan tidak ditemukan");
  }

  return await prisma.plan.update({ where: { id }, data });
}

export async function deletePlanService(id: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan) {
    throw new AppError(404, "PLAN_NOT_FOUND", "Plan tidak ditemukan");
  }

  // Soft delete
  return await prisma.plan.update({
    where: { id },
    data: { isActive: false },
  });
}

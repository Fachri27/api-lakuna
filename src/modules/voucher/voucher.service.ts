import { prisma } from "../../config/db.js";
import {
  GetVouchersInput,
  CreateVoucherInput,
  UpdateVoucherInput,
} from "./voucher.schema.js";

// GET /vouchers
export async function getVouchersService(query: GetVouchersInput) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.search) {
    where.OR = [
      { code: { contains: query.search } },
      { description: { contains: query.search } },
    ];
  }
  if (query.scope) where.scope = query.scope;
  if (query.isActive !== undefined) {
    where.isActive = query.isActive === "true";
  }

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    }),
    prisma.voucher.count({ where }),
  ]);

  return {
    data: vouchers.map((v) => ({
      ...v,
      usedCount: v._count.redemptions,
      _count: undefined,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// GET /vouchers/:id
export async function getVoucherByIdService(id: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      redemptions: {
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      },
    },
  });
  return voucher;
}

// POST /vouchers
export async function createVoucherService(data: CreateVoucherInput) {
  const voucher = await prisma.voucher.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description?.trim() || null,
      scope: data.scope,
      valueType: data.valueType,
      value: data.value,
      maxDiscount: data.maxDiscount ?? null,
      minSpend: data.minSpend ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      isActive: data.isActive,
      quotaTotal: data.quotaTotal ?? null,
      quotaPerUser: data.quotaPerUser,
    },
  });
  return voucher;
}

// PATCH /vouchers/:id
export async function updateVoucherService(
  id: string,
  data: Partial<CreateVoucherInput>,
) {
  const updateData: Record<string, unknown> = {};
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.description !== undefined)
    updateData.description = data.description?.trim() || null;
  if (data.scope !== undefined) updateData.scope = data.scope;
  if (data.valueType !== undefined) updateData.valueType = data.valueType;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount ?? null;
  if (data.minSpend !== undefined) updateData.minSpend = data.minSpend ?? null;
  if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
  if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.quotaTotal !== undefined) updateData.quotaTotal = data.quotaTotal ?? null;
  if (data.quotaPerUser !== undefined) updateData.quotaPerUser = data.quotaPerUser;

  const voucher = await prisma.voucher.update({
    where: { id },
    data: updateData,
  });
  return voucher;
}

// DELETE /vouchers/:id
export async function deleteVoucherService(id: string) {
  // Hapus redemptions dulu (kalau ada) lalu voucher
  await prisma.voucherRedemption.deleteMany({ where: { voucherId: id } });
  await prisma.voucher.delete({ where: { id } });
}
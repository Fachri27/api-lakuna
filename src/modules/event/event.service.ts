import { prisma } from "../../config/db.js";
import {
  GetEventsInput,
  CreateEventInput,
  UpdateEventInput,
} from "./event.schema.js";

// GET /events
export async function getEventsService(query: GetEventsInput) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { description: { contains: query.search } },
    ];
  }
  if (query.targetType) where.targetType = query.targetType;
  if (query.isActive !== undefined) where.isActive = query.isActive === "true";

  const [events, total] = await Promise.all([
    prisma.eventDiscount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { eventPhotos: true, eventPlans: true },
        },
      },
    }),
    prisma.eventDiscount.count({ where }),
  ]);

  return {
    data: events,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// GET /events/:id
export async function getEventByIdService(id: string) {
  const event = await prisma.eventDiscount.findUnique({
    where: { id },
    include: {
      eventPhotos: {
        include: {
          photo: {
            select: { id: true, title: true, thumbKey: true, price: true },
          },
        },
      },
      eventPlans: {
        include: {
          plan: { select: { id: true, quota: true, priceMonthly: true, priceAnnual: true, isActive: true } },
        },
      },
    },
  });
  return event;
}

// GET /events/active — event aktif untuk photoId atau planId tertentu
export async function getActiveEventsService(query: {
  photoId?: string;
  planId?: string;
}) {
  const now = new Date();
  const where = {
    isActive: true,
    startsAt: { lte: now },
    endsAt: { gte: now },
  };

  if (query.photoId) {
    const rows = await prisma.eventDiscount.findMany({
      where: { ...where, targetType: "PHOTO", eventPhotos: { some: { photoId: query.photoId } } },
      orderBy: { value: "desc" },
    });
    return rows;
  }

  if (query.planId) {
    const rows = await prisma.eventDiscount.findMany({
      where: { ...where, targetType: "PLAN", eventPlans: { some: { planId: query.planId } } },
      orderBy: { value: "desc" },
    });
    return rows;
  }

  return [];
}

// POST /events
export async function createEventService(data: CreateEventInput) {
  const { photoIds, planIds, ...rest } = data;

  const event = await prisma.eventDiscount.create({
    data: {
      name: rest.name,
      description: rest.description?.trim() || null,
      valueType: rest.valueType,
      value: rest.value,
      maxDiscount: rest.maxDiscount ?? null,
      startsAt: new Date(rest.startsAt),
      endsAt: new Date(rest.endsAt),
      isActive: rest.isActive,
      targetType: rest.targetType,
      ...(rest.targetType === "PHOTO" && {
        eventPhotos: {
          create: (photoIds || []).map((photoId) => ({ photoId })),
        },
      }),
      ...(rest.targetType === "PLAN" && {
        eventPlans: {
          create: (planIds || []).map((planId) => ({ planId })),
        },
      }),
    },
    include: {
      eventPhotos: { include: { photo: { select: { id: true, title: true } } } },
      eventPlans: { include: { plan: { select: { id: true, quota: true } } } },
    },
  });
  return event;
}

// PATCH /events/:id
export async function updateEventService(
  id: string,
  data: Partial<CreateEventInput>,
) {
  const { photoIds, planIds, ...rest } = data;

  const updateData: Record<string, unknown> = {};
  if (rest.name !== undefined) updateData.name = rest.name;
  if (rest.description !== undefined) updateData.description = rest.description?.trim() || null;
  if (rest.valueType !== undefined) updateData.valueType = rest.valueType;
  if (rest.value !== undefined) updateData.value = rest.value;
  if (rest.maxDiscount !== undefined) updateData.maxDiscount = rest.maxDiscount ?? null;
  if (rest.startsAt !== undefined) updateData.startsAt = new Date(rest.startsAt);
  if (rest.endsAt !== undefined) updateData.endsAt = new Date(rest.endsAt);
  if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
  if (rest.targetType !== undefined) updateData.targetType = rest.targetType;

  // Ganti target list bila disediakan
  if (photoIds !== undefined) {
    await prisma.eventPhoto.deleteMany({ where: { eventId: id } });
    if (photoIds.length > 0) {
      await prisma.eventPhoto.createMany({
        data: photoIds.map((photoId) => ({ eventId: id, photoId })),
      });
    }
  }
  if (planIds !== undefined) {
    await prisma.eventPlan.deleteMany({ where: { eventId: id } });
    if (planIds.length > 0) {
      await prisma.eventPlan.createMany({
        data: planIds.map((planId) => ({ eventId: id, planId })),
      });
    }
  }

  const event = await prisma.eventDiscount.update({
    where: { id },
    data: updateData,
    include: {
      eventPhotos: { include: { photo: { select: { id: true, title: true } } } },
      eventPlans: { include: { plan: { select: { id: true, quota: true } } } },
    },
  });
  return event;
}

// DELETE /events/:id
export async function deleteEventService(id: string) {
  await prisma.eventPhoto.deleteMany({ where: { eventId: id } });
  await prisma.eventPlan.deleteMany({ where: { eventId: id } });
  await prisma.eventDiscount.delete({ where: { id } });
}
import { prisma } from "../../config/db.js";
import { GetPhotographersInput, CreatePhotographerInput } from "./photographer.schema.js";
import { AppError } from "../../middlewares/errorHandler.js";

export async function getPhotographersService(query: GetPhotographersInput) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const where = query.search
    ? { name: { contains: query.search } }
    : {};

  const [photographers, total] = await Promise.all([
    prisma.photographer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.photographer.count({ where }),
  ]);

  return {
    data: photographers,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPhotographerByIdService(id: string) {
  const photographer = await prisma.photographer.findUnique({ where: { id } });
  if (!photographer) {
    throw new AppError(404, "PHOTOGRAPHER_NOT_FOUND", "Fotografer tidak ditemukan");
  }
  return photographer;
}

export async function createPhotographerService(data: CreatePhotographerInput) {
  const existing = await prisma.photographer.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError(409, "PHOTOGRAPHER_EXISTS", "Fotografer sudah ada");
  }
  return prisma.photographer.create({ data: { name: data.name, bio: data.bio ?? null } });
}

export async function updatePhotographerService(id: string, data: CreatePhotographerInput) {
  const existing = await prisma.photographer.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "PHOTOGRAPHER_NOT_FOUND", "Fotografer tidak ditemukan");
  }
  if (data.name !== existing.name) {
    const duplicate = await prisma.photographer.findUnique({ where: { name: data.name } });
    if (duplicate) {
      throw new AppError(409, "PHOTOGRAPHER_EXISTS", "Fotografer sudah ada");
    }
  }
  return prisma.photographer.update({
    where: { id },
    data: { name: data.name, bio: data.bio ?? null },
  });
}

export async function deletePhotographerService(id: string) {
  const existing = await prisma.photographer.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "PHOTOGRAPHER_NOT_FOUND", "Fotografer tidak ditemukan");
  }
  await prisma.photographer.delete({ where: { id } });
  return { success: true };
}

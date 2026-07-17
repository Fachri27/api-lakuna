import { prisma } from "../../config/db.js";
import { GetKeywordsInput, CreateKeywordInput } from "./keyword.schema.js";
import { AppError } from "../../middlewares/errorHandler.js";

// Get all keywords with pagination
export async function getKeywordsService(query: GetKeywordsInput) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = query.search
    ? {
        name: {
          contains: query.search,
        },
      }
    : {};

  const [keywords, total] = await Promise.all([
    prisma.keyword.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.keyword.count({ where }),
  ]);

  return {
    data: keywords,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get keyword by ID
export async function getKeywordByIdService(id: string) {
  const keyword = await prisma.keyword.findUnique({
    where: { id },
  });

  if (!keyword) {
    throw new AppError(404, "KEYWORD_NOT_FOUND", "Keyword tidak ditemukan");
  }

  return keyword;
}

// Create keyword
export async function createKeywordService(data: CreateKeywordInput) {
  const existingKeyword = await prisma.keyword.findUnique({
    where: { name: data.name },
  });

  if (existingKeyword) {
    throw new AppError(409, "KEYWORD_EXISTS", "Keyword sudah ada");
  }

  const keyword = await prisma.keyword.create({
    data: {
      name: data.name,
    },
  });

  return keyword;
}

// Update keyword
export async function updateKeywordService(
  id: string,
  data: CreateKeywordInput,
) {
  const existingKeyword = await prisma.keyword.findUnique({
    where: { id },
  });

  if (!existingKeyword) {
    throw new AppError(404, "KEYWORD_NOT_FOUND", "Keyword tidak ditemukan");
  }

  // Check if new name already exists (and it's not the same keyword)
  if (data.name !== existingKeyword.name) {
    const duplicateKeyword = await prisma.keyword.findUnique({
      where: { name: data.name },
    });

    if (duplicateKeyword) {
      throw new AppError(409, "KEYWORD_EXISTS", "Keyword sudah ada");
    }
  }

  const keyword = await prisma.keyword.update({
    where: { id },
    data: {
      name: data.name,
    },
  });

  return keyword;
}

// Delete keyword
export async function deleteKeywordService(id: string) {
  const existingKeyword = await prisma.keyword.findUnique({
    where: { id },
    include: {
      _count: {
        select: { photoKeywords: true },
      },
    },
  });

  if (!existingKeyword) {
    throw new AppError(404, "KEYWORD_NOT_FOUND", "Keyword tidak ditemukan");
  }

  // Check if keyword is being used by photos
  if (existingKeyword._count.photoKeywords > 0) {
    throw new AppError(
      400,
      "KEYWORD_IN_USE",
      "Keyword sedang digunakan oleh foto dan tidak dapat dihapus",
    );
  }

  await prisma.keyword.delete({
    where: { id },
  });

  return { success: true };
}

import { prisma } from "../../config/db.js";
import { GetKeywordsInput, CreateKeywordInput } from "./keyword.schema.js";
import { AppError } from "../../middlewares/errorHandler.js";

// Get all keywords with pagination
export async function getKeywordsService(query: GetKeywordsInput) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    ...(query.search ? { name: { contains: query.search } } : {}),
    ...(query.lang ? { lang: query.lang } : {}),
  };

  const [keywords, total] = await Promise.all([
    prisma.keyword.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lang: "asc" as const }, { name: "asc" as const }],
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
    where: { name_lang: { name: data.name, lang: data.lang } },
  });

  if (existingKeyword) {
    throw new AppError(409, "KEYWORD_EXISTS", "Keyword sudah ada");
  }

  const keyword = await prisma.keyword.create({
    data: {
      name: data.name,
      lang: data.lang,
    },
  });

  return keyword;
}

// Update keyword
export async function updateKeywordService(
  id: string,
  data: { name: string },
) {
  const existingKeyword = await prisma.keyword.findUnique({
    where: { id },
  });

  if (!existingKeyword) {
    throw new AppError(404, "KEYWORD_NOT_FOUND", "Keyword tidak ditemukan");
  }

  // Check if new name already exists (and it's not the same keyword)
  if (data.name !== existingKeyword.name) {
    // Bahasa kata kunci tidak berubah lewat update; duplikat dicek dalam bahasa yang sama.
    const duplicateKeyword = await prisma.keyword.findUnique({
      where: { name_lang: { name: data.name, lang: existingKeyword.lang } },
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

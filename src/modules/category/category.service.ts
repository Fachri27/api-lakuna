import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";
import { uploadBuffer } from "../../utils/uploadToMinio.js";
import { AppError } from "../../middlewares/errorHandler.js";
import {
  GetCategoriesInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";
import crypto from "crypto";
import sharp from "sharp";

/**
 * Mimetype + content verification for category images (stored-XSS hardening).
 *
 * - Extension is derived from the verified/re-encoded output (always `.jpg`),
 *   never from `file.originalname` (attacker-controlled).
 * - `file.mimetype` is client-controlled, so the actual bytes are verified via
 *   `sharp(buffer).metadata()`; only jpeg/png/webp are accepted.
 * - The buffer is re-encoded to JPEG, which strips any embedded active content
 *   (e.g. `<script>` inside an SVG/polyglot masquerading as an image — sharp
 *   fails to decode those outright) and normalizes the stored Content-Type to
 *   `image/jpeg` so the object can never be served as SVG/HTML.
 */
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "jpg", "png", "webp"]);

async function sanitizeImageUpload(file: Express.Multer.File): Promise<{
  buffer: Buffer;
  mimetype: "image/jpeg";
  ext: "jpg";
}> {
  const mime = (file.mimetype || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/svg+xml" || mime === "text/html" || mime.includes("+xml")) {
    throw new AppError(400, "INVALID_FILE_TYPE", "File harus gambar JPG, PNG, atau WebP");
  }
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new AppError(400, "INVALID_FILE_TYPE", "File harus gambar JPG, PNG, atau WebP");
  }

  let format: string | undefined;
  try {
    const metadata = await sharp(file.buffer).metadata();
    format = metadata.format?.toLowerCase();
  } catch {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }
  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }

  try {
    const buffer = await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer();
    return { buffer, mimetype: "image/jpeg", ext: "jpg" };
  } catch {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.",
    );
  }
}

// GET /categories
export async function getCategoriesService(query: GetCategoriesInput) {
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

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.category.count({ where }),
  ]);

  // Satu imageKey yatim (file hilang di storage / tunnel storage mati)
  // tidak boleh menumbangkan SELURUH daftar — fallback null per item,
  // pola yang sama dengan mapPhotoRow.
  const data = await Promise.all(
    categories.map(async (cat) => {
      let imageUrl: string | null = null;
      if (cat.imageKey) {
        try {
          imageUrl = await getPresignedUrl(cat.imageKey);
        } catch {
          imageUrl = null;
        }
      }
      return { ...cat, imageUrl };
    })
  );

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// GET /categories/:id
export async function getCategoryByIdService(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      photoCategories: {
        include: {
          photo: {
            select: {
              id: true,
              title: true,
              thumbKey: true,
            },
          },
        },
      },
    },
  });

  if (!category) return null;

  let imageUrl: string | null = null;
  if (category.imageKey) {
    try {
      imageUrl = await getPresignedUrl(category.imageKey);
    } catch {
      imageUrl = null;
    }
  }

  return {
    ...category,
    imageUrl,
  };
}

// POST /categories
export async function createCategoryService(
  data: CreateCategoryInput,
  file?: Express.Multer.File,
) {
  let imageKey: string | null = null;

  if (file) {
    const clean = await sanitizeImageUpload(file);
    imageKey = `categories/${crypto.randomUUID()}.${clean.ext}`;
    await uploadBuffer(imageKey, clean.buffer, clean.mimetype);
  }

  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      imageKey,
    },
  });

  return {
    ...category,
    imageUrl: category.imageKey ? await getPresignedUrl(category.imageKey) : null,
  };
}

// PATCH /categories/:id
export async function updateCategoryService(
  id: string,
  data: { name?: string; description?: string; imageKey?: string },
  file?: Express.Multer.File,
) {
  if (file) {
    const clean = await sanitizeImageUpload(file);
    const imageKey = `categories/${crypto.randomUUID()}.${clean.ext}`;
    await uploadBuffer(imageKey, clean.buffer, clean.mimetype);
    data = { ...data, imageKey };
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.imageKey !== undefined && { imageKey: data.imageKey }),
    },
  });

  return {
    ...category,
    imageUrl: category.imageKey ? await getPresignedUrl(category.imageKey) : null,
  };
}

// DELETE /categories/:id
export async function deleteCategoryService(id: string) {
  await prisma.category.delete({
    where: { id },
  });
}

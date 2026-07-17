import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { redisClient } from "../../config/redis.js";
import { GetPhotosInput } from "./photo.schema.js";
import { AppError } from "../../middlewares/errorHandler.js";
import sharp from "sharp";
import crypto from "crypto";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { uploadBuffer } from "../../utils/uploadToMinio.js";
import { getPresignedUrl } from "../../config/minio.js";

type PhotoInput = {
  file: Express.Multer.File;
  watermark?: Express.Multer.File;
  title: string;
  description?: string;
  userId: string;
  role: string;
  photographer: string;
  price: number | string;
  type: "FOTO" | "VIDEO";
};

// Update photo dengan cache invalidate
type UpdatePhotoInput = {
  id: string;
  title?: string;
  description?: string;
  photographer?: string;
  price?: number | string;
  file?: Express.Multer.File;
  watermark?: Express.Multer.File;
};

function parsePrice(price: number | string) {
  const normalizedPriceInput =
    typeof price === "string" ? price.replace(/[^\d-]/g, "") : price;
  const parsedPrice = Number(normalizedPriceInput);

  if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
    throw new AppError(
      400,
      "INVALID_PRICE",
      `Price harus berupa angka bulat >= 0 (nilai diterima: ${String(price)})`,
    );
  }

  return parsedPrice;
}

async function buildPhotoAssets(
  fileBuffer: Buffer,
  mimeType?: string,
  watermarkFile?: Express.Multer.File,
) {
   const filename = crypto.randomUUID();
   const isVideo = mimeType?.startsWith("video/") ?? false;

   if (isVideo) {
     const tempDir = mkdtempSync(join(tmpdir(), "lakuna-"));
     const ext = mimeType === "video/mp4" ? ".mp4" : mimeType === "video/webm" ? ".webm" : ".mov";
     const videoPath = join(tempDir, `input${ext}`);
     const thumbPath = join(tempDir, "thumb.jpg");
     const h264Path = join(tempDir, "h264.mp4");

     writeFileSync(videoPath, fileBuffer);

     try {
       // Generate thumbnail
       execSync(
         `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=400:-1" -q:v 2 "${thumbPath}" -y`,
         { stdio: "pipe" }
       );
       console.log("[FFMPEG] Thumbnail generated:", thumbPath);

       // Re-encode to H.264 MP4 for browser compatibility
       execSync(
         `ffmpeg -i "${videoPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart "${h264Path}" -y`,
         { stdio: "pipe" }
       );
       console.log("[FFMPEG] H.264 video encoded:", h264Path);
     } catch (err: any) {
       console.error("[FFMPEG] Failed:", err?.stderr?.toString() || err.message);
      const placeholder = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 30, g: 30, b: 30 } }
      }).jpeg({ quality: 80 }).toBuffer();
      writeFileSync(thumbPath, placeholder);
    }

    const thumbBuffer = readFileSync(thumbPath);

    // Use H.264 encoded video if available, otherwise original
    const h264Buffer = existsSync(h264Path) ? readFileSync(h264Path) : fileBuffer;

    // Upload original video
    const originalKey = `original/${filename}${ext}`;
    const thumbKey = `thumb/${filename}.jpg`;
    const watermarkKey = `watermark/${filename}.mp4`; // Always MP4 for browser compatibility

    await uploadBuffer(originalKey, fileBuffer, mimeType || "video/mp4");
    await uploadBuffer(thumbKey, thumbBuffer, "image/jpeg");
    await uploadBuffer(watermarkKey, h264Buffer, "video/mp4");

    // Cleanup temp files
    try { unlinkSync(videoPath); } catch {}
    try { unlinkSync(thumbPath); } catch {}
    try { unlinkSync(h264Path); } catch {}

    return { width: null, height: null, format: "video", originalKey, thumbKey, watermarkKey };
  }

  // Image processing
  const metadata = await sharp(fileBuffer).metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const format = metadata.format ?? null;

  const originalBuffer = await sharp(fileBuffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  const thumbnailBuffer = await sharp(fileBuffer)
    .resize({ width: 400 })
    .jpeg({ quality: 80 })
    .toBuffer();

const watermarkBuffer = await sharp(fileBuffer)
     .resize({ width: 1200 })
     .composite([
       {
         input: Buffer.from(`
             <svg viewBox="0 0 800 400" width="800" height="400">
               <text
                 x="400"
                 y="200"
                 font-family="Arial, sans-serif"
                 font-size="120"
                 fill="white"
                 opacity="0.5"
                 text-anchor="middle"
               >
                 LAKUNA
               </text>
             </svg>
           `),
         gravity: "center",
       },
     ])
     .jpeg({ quality: 80 })
     .toBuffer();

  const originalKey = `original/${filename}.jpg`;
  const thumbKey = `thumb/${filename}.jpg`;

  // Watermark: pakai file watermark custom (disimpan apa adanya) bila diupload;
  // selain itu fallback ke composite teks "LAKUNA" otomatis.
  let watermarkKey: string;
  if (watermarkFile) {
    const wmExt =
      watermarkFile.mimetype === "image/png"
        ? ".png"
        : watermarkFile.mimetype === "image/webp"
          ? ".webp"
          : watermarkFile.mimetype === "image/gif"
            ? ".gif"
            : ".jpg";
    watermarkKey = `watermark/${filename}${wmExt}`;
    await uploadBuffer(watermarkKey, watermarkFile.buffer, watermarkFile.mimetype);
  } else {
    watermarkKey = `watermark/${filename}.jpg`;
    await uploadBuffer(watermarkKey, watermarkBuffer, "image/jpeg");
  }

  await uploadBuffer(originalKey, originalBuffer, "image/jpeg");
  await uploadBuffer(thumbKey, thumbnailBuffer, "image/jpeg");

  return { width, height, format, originalKey, thumbKey, watermarkKey };
}

export async function getPhotoService(query: GetPhotosInput) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 12;
  const skip = (page - 1) * limit;

  const cacheKey = `v4:photos:${query.search || query.categoryId || "all"}:${page}:${limit}`;

  // Clear old cache (disable cache for now)
  await redisClient.del(cacheKey).catch(() => {});
  const where: any = {
    deletedAt: null,
    status: "APPROVED",
  };

  if (query.type) {
    where.type = query.type;
  }

  // If category name provided, filter by exact category match only (via photoCategories)
  if (query.categoryId) {
    where.photoCategories = {
      some: {
        category: {
          name: query.categoryId,
        },
      },
    };
  } else if (query.search) {
    // Search in title, photographer, OR category name, OR keywords
    where.OR = [
      {
        title: {
          contains: query.search,
        },
      },
      {
        photographer: {
          contains: query.search,
        },
      },
      {
        photoCategories: {
          some: {
            category: {
              name: {
                contains: query.search,
              },
            },
          },
        },
      },
      {
        photoKeywords: {
          some: {
            keyword: {
              name: {
                contains: query.search,
              },
            },
          },
        },
      },
    ];
  }

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        photoCategories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        photoKeywords: {
          select: {
            keyword: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.photo.count({ where }),
  ]);

    const formattedPhotos = await Promise.all(
      photos.map(async (photo) => {
        let thumbUrl = null;
        let watermarkUrl = null;
        let originalUrl = null;

        try {
          if (photo.thumbKey) thumbUrl = await getPresignedUrl(photo.thumbKey);
          if (photo.watermarkKey)
            watermarkUrl = await getPresignedUrl(photo.watermarkKey);
          if (photo.originalKey)
            originalUrl = await getPresignedUrl(photo.originalKey);
        } catch (urlErr) {
          console.error(
            "Failed to generate presigned URLs for photo:",
            photo.id,
          );
        }

        // Gabungkan categories dan keywords sebagai tags
        const categories = photo.photoCategories?.map((pc) => pc?.category?.name).filter(Boolean) || [];
        const keywords = photo.photoKeywords?.map((pk) => pk?.keyword?.name).filter(Boolean) || [];
        
        // Deduplicate dan batasi maksimal 5 tags
        const allTags = [...categories, ...keywords];
        const tags = [...new Set(allTags)].slice(0, 5);

        return {
          ...photo,
          tags, // Tambahkan tags
          thumbUrl:
            thumbUrl || `https://picsum.photos/seed/${photo.id}/400/300`,
          watermarkUrl:
            watermarkUrl || `https://picsum.photos/seed/${photo.id}/800/600`,
          originalUrl,
        };
      }),
    );

    const result = {
      data: formattedPhotos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Don't cache untuk debugging - akan di-enable nanti
    /*
    try {
      await redisClient.set(
        cacheKey,
        JSON.stringify(result),
        "EX",
        60 * 4,
      );
    } catch (cacheErr) {
      console.error("Failed to cache photos list:", cacheErr);
    }
    */

    return result;
}

// Get single photo by ID with Redis cache
export async function getPhotoByIdService(id: string) {
  // Cache key untuk foto single
  const cacheKey = `photo:${id}`;

  try {
    // Cek di Redis dulu
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("CACHE HIT for photo:", id);
      return JSON.parse(cached);
    }

    console.log("CACHE MISS for photo:", id);

    // Query dari database
    const photo = await prisma.photo.findUnique({
      where: {
        id,
        deletedAt: null,
        status: "APPROVED",
      },
      include: {
        photoKeywords: {
          select: {
            keyword: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Jika foto tidak ditemukan
    if (!photo) {
      return null;
    }

    // Tambahkan URL untuk image (dengan fallback)
    let thumbUrl = null;
    let watermarkUrl = null;

    try {
      if (photo.thumbKey) thumbUrl = await getPresignedUrl(photo.thumbKey);
      if (photo.watermarkKey)
        watermarkUrl = await getPresignedUrl(photo.watermarkKey);
    } catch (urlErr) {
      console.error("Failed to generate presigned URLs:", urlErr);
      // Fallback ke URL placeholder
    }

    const photoWithUrls = {
      ...photo,
      thumbUrl: thumbUrl || `https://picsum.photos/seed/${photo.id}/400/300`,
      watermarkUrl:
        watermarkUrl || `https://picsum.photos/seed/${photo.id}/800/600`,
    };

    // Simpan ke cache 10 menit (foto jarang berubah)
    try {
      await redisClient.set(
        cacheKey,
        JSON.stringify(photoWithUrls),
        "EX",
        60 * 10,
      );
    } catch (cacheErr) {
      console.error("Failed to cache photo:", cacheErr);
    }

    return photoWithUrls;
  } catch (err) {
    console.error("Error in getPhotoByIdService:", err);
    throw err;
  }
}

export async function updatePhotoService(data: UpdatePhotoInput) {
  const { id, file, watermark, price, ...restUpdateData } = data;

  // 1. Cek apakah foto ada
  const existingPhoto = await prisma.photo.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingPhoto) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
  }

  const updateData: Prisma.PhotoUpdateInput = {
    ...restUpdateData,
  };

  if (price !== undefined) {
    updateData.price = parsePrice(price);
  }

  if (file) {
    const assets = await buildPhotoAssets(file.buffer, file.mimetype, watermark);
    updateData.originalKey = assets.originalKey;
    updateData.thumbKey = assets.thumbKey;
    updateData.watermarkKey = assets.watermarkKey;
    updateData.width = assets.width;
    updateData.height = assets.height;
    updateData.format = assets.format;
  } else if (watermark) {
    // Hanya ganti watermark tanpa re-upload foto.
    const wmFilename = crypto.randomUUID();
    const wmExt =
      watermark.mimetype === "image/png"
        ? ".png"
        : watermark.mimetype === "image/webp"
          ? ".webp"
          : watermark.mimetype === "image/gif"
            ? ".gif"
            : ".jpg";
    const watermarkKey = `watermark/${wmFilename}${wmExt}`;
    await uploadBuffer(watermarkKey, watermark.buffer, watermark.mimetype);
    updateData.watermarkKey = watermarkKey;
  }

  // 2. Update di database
  const updatedPhoto = await prisma.photo.update({
    where: { id },
    data: updateData,
  });

  // 3. Invalidate cache
  const cacheKey = `photo:${id}`;
  await redisClient.del(cacheKey);

  // Invalidate semua cache list photos
  const listKeys = await redisClient.keys("v4:photos:*");
  if (listKeys.length > 0) {
    await redisClient.del(listKeys);
  }
  console.log("CACHE INVALIDATED for photo:", id);

  return updatedPhoto;
}

// service untuk GET /photos/:id/related
export async function getPhotoByRelatedService(id: string) {
  // ambil photo dan keyword
  const photo = await prisma.photo.findFirst({
    where: {
      id,
      deletedAt: null,
    },

    include: {
      photoKeywords: true,
    },
  });

  // cek photo
  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Photo tidak di temukan");
  }

  // ambil keyword ids
  const keywordIds = photo.photoKeywords.map((pk) => pk.keywordId);

  // cari photo related
  const related = await prisma.photo.findMany({
    where: {
      deletedAt: null,
      status: "APPROVED",

      NOT: {
        id,
      },

      // punya keyword sama
      photoKeywords: {
        some: {
          keywordId: {
            in: keywordIds,
          },
        },
      },
    },

    take: 8,

    include: {
      photoKeywords: {
        select: {
          keyword: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Tambahkan thumbUrl untuk masing-masing related photo
  const photosWithUrls = await Promise.all(
    related.map(async (p) => ({
      ...p,
      thumbUrl: p.thumbKey ? await getPresignedUrl(p.thumbKey) : null,
      watermarkUrl: p.watermarkKey
        ? await getPresignedUrl(p.watermarkKey)
        : null,
    })),
  );

  return photosWithUrls;
}

// service upload
export async function uploadPhotoService(data: PhotoInput) {
  const parsedPrice = parsePrice(data.price);
  const assets = await buildPhotoAssets(
    data.file.buffer,
    data.file.mimetype,
    data.watermark,
  );

  const status = data.role === "CONTRIBUTOR" ? "PENDING" : "APPROVED";

  // upload ke db
  const createData: Prisma.PhotoCreateInput = {
    title: data.title,

    description: data.description ?? null,

    photographer: data.photographer,
    type: data.type,
    status,

    price: parsedPrice,
    width: assets.width,
    height: assets.height,
    format: assets.format,

    user: {
      connect: {
        id: data.userId,
      },
    },

    originalKey: assets.originalKey,
    thumbKey: assets.thumbKey,
    watermarkKey: assets.watermarkKey,
  };

  const photo = await prisma.photo.create({
    data: createData,
  });

  const keys = await redisClient.keys("v4:photos:*");

  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  return photo;
}

// service delete
export async function deletePhotoService(data: {
  userId: string;
  photoId: string;
  role: string;
}) {
  const photo = await prisma.photo.findUnique({
    where: {
      id: data.photoId,
    },
  });

  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Photo tidak ditemukan");
  }

  const isOwner = photo.userId === data.userId;
  const isAdmin = data.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "FORBIDDEN", "Tidak punya akses");
  }

  // soft delete
  await prisma.photo.update({
    where: {
      id: photo.id,
    },

    data: {
      deletedAt: new Date(),
    },
  });

  // validated cache
  await redisClient.del(`photo:${data.photoId}`);

  const key = await redisClient.keys("v4:photos:*");
  if (key.length > 0) {
    await redisClient.del(key);
  }
}

// Photo Keyword services

// Tambah keyword ke photo
export async function addPhotoKeywordsService(
  photoId: string,
  keywordIds: string[],
) {
  // Cek photo exists
  const photo = await prisma.photo.findUnique({
    where: { id: photoId, deletedAt: null },
  });

  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
  }

  // Cek semua keywords exists
  const keywords = await prisma.keyword.findMany({
    where: { id: { in: keywordIds } },
  });

  if (keywords.length !== keywordIds.length) {
    throw new AppError(
      404,
      "KEYWORD_NOT_FOUND",
      "Salah satu keyword tidak ditemukan",
    );
  }

  // Tambah photo keywords
  const photoKeywords = await Promise.all(
    keywordIds.map((keywordId) =>
      prisma.photoKeyword.create({
        data: {
          photoId,
          keywordId,
        },
      }),
    ),
  );

  // Invalidate cache
  await redisClient.del(`photo:${photoId}`);
  const listKeys = await redisClient.keys("v4:photos:*");
  if (listKeys.length > 0) {
    await redisClient.del(listKeys);
  }

  return photoKeywords;
}

// Hapus keyword dari photo
export async function removePhotoKeywordService(
  photoId: string,
  keywordId: string,
) {
  // Cek apakah photo keyword exists
  const photoKeyword = await prisma.photoKeyword.findUnique({
    where: {
      photoId_keywordId: {
        photoId,
        keywordId,
      },
    },
  });

  if (!photoKeyword) {
    throw new AppError(
      404,
      "PHOTO_KEYWORD_NOT_FOUND",
      "Keyword tidak terkait dengan foto ini",
    );
  }

  // Hapus photo keyword
  await prisma.photoKeyword.delete({
    where: {
      photoId_keywordId: {
        photoId,
        keywordId,
      },
    },
  });

  // Invalidate cache
  await redisClient.del(`photo:${photoId}`);

  return { success: true };
}

// Tambah category ke photo
export async function addPhotoCategoriesService(
  photoId: string,
  categoryIds: string[],
) {
  // Cek photo exists
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
  }

  // Cek categories exists
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
  });

  if (categories.length !== categoryIds.length) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Beberapa category tidak ditemukan",
    );
  }

  // Buat photo-category relations
  const photoCategories = await Promise.all(
    categoryIds.map((categoryId) =>
      prisma.photoCategory.create({
        data: {
          photoId,
          categoryId,
        },
      }),
    ),
  );

  // Invalidate cache
  await redisClient.del(`photo:${photoId}`);
  const listKeys = await redisClient.keys("v4:photos:*");
  if (listKeys.length > 0) {
    await redisClient.del(listKeys);
  }

  return photoCategories;
}

// Hapus category dari photo
export async function removePhotoCategoryService(
  photoId: string,
  categoryId: string,
) {
  // Cek apakah photo category exists
  const photoCategory = await prisma.photoCategory.findUnique({
    where: {
      photoId_categoryId: {
        photoId,
        categoryId,
      },
    },
  });

  if (!photoCategory) {
    throw new AppError(
      404,
      "PHOTO_CATEGORY_NOT_FOUND",
      "Category tidak terkait dengan foto ini",
    );
  }

  // Hapus photo category
  await prisma.photoCategory.delete({
    where: {
      photoId_categoryId: {
        photoId,
        categoryId,
      },
    },
  });

  // Invalidate cache
  await redisClient.del(`photo:${photoId}`);

  return { success: true };
}

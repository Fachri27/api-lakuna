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
import { INDONESIA_PLACES } from "../../utils/indonesiaPlaces.js";
import { makeThumb, makePreviewImage, makePreviewVideo, makeClipVideo, clipKeyFor, grabVideoFrame } from "./publicAssets.js";

// Foto yang sudah dilaporkan gagal membuat link (hindari banjir log tiap request).
const presignFailedLogged = new Set<string>();

type PhotoInput = {
  file: Express.Multer.File;
  watermark?: Express.Multer.File;
  title: string;
  description?: string;
  titleEn?: string;
  descriptionEn?: string;
  location?: string;
  batchId?: string;
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
  description?: string | null;
  titleEn?: string | null;
  descriptionEn?: string | null;
  location?: string | null;
  photographer?: string;
  price?: number | string;
  type?: "FOTO" | "VIDEO";
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
  /** ID foto untuk pita kredit "lakunastock · ID" di aset publik. */
  photoId?: string,
) {
   const filename = crypto.randomUUID();
   const isVideo = mimeType?.startsWith("video/") ?? false;

   if (isVideo) {
     const tempDir = mkdtempSync(join(tmpdir(), "lakuna-"));
     const ext = mimeType === "video/mp4" ? ".mp4" : mimeType === "video/webm" ? ".webm" : ".mov";
     const videoPath = join(tempDir, `input${ext}`);
     const h264Path = join(tempDir, "h264.mp4");

     writeFileSync(videoPath, fileBuffer);

     // Aset publik (lihat publicAssets.ts): thumbnail dari frame detik ke-1
     // dan pratinjau mp4 — keduanya kecil & ber-watermark. File asli hanya
     // untuk /api/downloads berlisensi.
     const framePath = join(tempDir, "frame.jpg");
     let thumbBuffer: Buffer;
     if (grabVideoFrame(videoPath, framePath)) {
       thumbBuffer = await makeThumb(readFileSync(framePath), photoId);
       try { unlinkSync(framePath); } catch {}
     } else {
       thumbBuffer = await sharp({
         create: { width: 480, height: 270, channels: 3, background: { r: 30, g: 30, b: 30 } },
       }).jpeg({ quality: 70 }).toBuffer();
     }
     await makePreviewVideo(videoPath, h264Path);
     // Klip kartu bersih (tanpa watermark) untuk hover di grid.
     const clipPath = join(tempDir, "clip.mp4");
     const clipOk = makeClipVideo(videoPath, clipPath);

    // Pratinjau publik ber-watermark. Bila ffmpeg gagal JANGAN pakai file
    // asli sebagai cadangan (bocor) — pakai thumbnail sebagai poster saja.
    const h264Buffer = existsSync(h264Path) ? readFileSync(h264Path) : null;

    // Upload original video
    const originalKey = `original/${filename}${ext}`;
    const thumbKey = `thumb/${filename}.jpg`;
    const watermarkKey = `watermark/${filename}.mp4`; // Always MP4 for browser compatibility

    await uploadBuffer(originalKey, fileBuffer, mimeType || "video/mp4");
    await uploadBuffer(thumbKey, thumbBuffer, "image/jpeg");
    if (h264Buffer) await uploadBuffer(watermarkKey, h264Buffer, "video/mp4");
    const clipKey = clipKeyFor(watermarkKey);
    // Hanya klip yang SELESAI diunggah; yang gagal/terpotong dilewati → kartu memakai pratinjau ber-watermark.
    if (clipKey && clipOk && existsSync(clipPath)) await uploadBuffer(clipKey, readFileSync(clipPath), "video/mp4");

    // Cleanup temp files
    try { unlinkSync(videoPath); } catch {}
    try { unlinkSync(h264Path); } catch {}
    try { unlinkSync(clipPath); } catch {}

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

  // Aset publik kecil & ber-watermark (lihat publicAssets.ts). Pratinjau
  // 1000 px untuk halaman detail/lightbox, thumbnail 480 px untuk grid.
  const watermarkBuffer = await makePreviewImage(fileBuffer, photoId);
  const thumbnailBuffer = await makeThumb(fileBuffer, photoId);

  const originalKey = `original/${filename}.jpg`;
  const thumbKey = `thumb/${filename}.jpg`;
  const watermarkKey = `watermark/${filename}.jpg`;
  await uploadBuffer(watermarkKey, watermarkBuffer, "image/jpeg");

  await uploadBuffer(originalKey, originalBuffer, "image/jpeg");
  await uploadBuffer(thumbKey, thumbnailBuffer, "image/jpeg");

  return { width, height, format, originalKey, thumbKey, watermarkKey };
}

/**
 * Petakan satu baris Photo Prisma (dengan relasi categories/keywords) menjadi
 * shape publik yang dikembalikan API: tambah thumbUrl/watermarkUrl/originalUrl
 * (presigned, fallback picsum) + tags (gabungan category+keyword, max 5).
 * Dipakai getPhotoService, getPhotosByIdsService, resolve homepage, dan
 * daftar pending admin (pratinjau watermark untuk kurasi).
 */
export async function mapPhotoRow(photo: any) {
  let thumbUrl = null;
  let watermarkUrl = null;
  // Klip kartu bersih (video saja); null = belum dibuat → kartu memakai pratinjau.
  let clipUrl: string | null = null;

  // TIDAK ada originalUrl di respons publik: file asli hanya lewat
  // /api/downloads (cek lisensi/langganan). Dulu URL presigned file asli
  // ikut terkirim ke siapa pun — terbaca dari tab Network.
  try {
    if (photo.thumbKey) thumbUrl = await getPresignedUrl(photo.thumbKey);
    if (photo.watermarkKey) watermarkUrl = await getPresignedUrl(photo.watermarkKey);
  } catch {
    // Penyebabnya sudah dicatat (sekali per key) oleh getPresignedUrl.
    if (!presignFailedLogged.has(photo.id) && presignFailedLogged.size < 1000) {
      presignFailedLogged.add(photo.id);
      console.warn("Presigned URL gagal, memakai gambar contoh untuk foto:", photo.id);
    }
  }
  if (photo.type === "VIDEO") {
    const clipKey = clipKeyFor(photo.watermarkKey);
    if (clipKey) clipUrl = await getPresignedUrl(clipKey).catch(() => null);
  }

  const categories = photo.photoCategories?.map((pc: any) => pc?.category?.name).filter(Boolean) || [];
  const keywords = photo.photoKeywords?.map((pk: any) => pk?.keyword?.name).filter(Boolean) || [];
  const allTags = [...categories, ...keywords];
  const tags = [...new Set(allTags)].slice(0, 5);

  const { originalKey: _omitOriginalKey, ...pub } = photo;
  return {
    ...pub,
    tags,
    thumbUrl: thumbUrl || `https://picsum.photos/seed/${photo.id}/400/300`,
    watermarkUrl: watermarkUrl || `https://picsum.photos/seed/${photo.id}/800/600`,
    originalUrl: null,
    clipUrl,
  };
}

/**
 * Ambil beberapa foto sekaligus berdasarkan daftar id (hanya APPROVED & tidak
 * terhapus), diurutkan sesuai urutan id yang diminta. Dipakai homepage untuk
 * resolve photoIds → objek foto. Bila id tidak ditemukan, dilewati.
 */
export async function getPhotosByIdsService(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return [];
  const photos = await prisma.photo.findMany({
    where: { id: { in: unique }, deletedAt: null, status: "APPROVED" },
    include: {
      photoCategories: { select: { category: { select: { name: true } } } },
      photoKeywords: { select: { keyword: { select: { name: true, lang: true } } } },
    },
  });
  const byId = new Map(photos.map((p) => [p.id, p]));
  const ordered = unique.map((id) => byId.get(id)).filter(Boolean) as any[];
  return Promise.all(ordered.map((p) => mapPhotoRow(p)));
}

export async function getPhotoService(query: GetPhotosInput) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  const skip = (page - 1) * limit;

  const cacheKey = `v4:photos:${query.search || query.categoryId || "all"}:${query.photographer || "-"}:${query.type || "any"}:${query.sort || "newest"}:${query.period || "all"}:${page}:${limit}`;

  // Clear old cache (disable cache for now)
  await redisClient.del(cacheKey).catch(() => {});
  const where: any = {
    deletedAt: null,
    status: "APPROVED",
  };

  if (query.type) {
    where.type = query.type;
  }

  // Karya satu fotografer (tautan "oleh …" di halaman detail): nama persis, bukan pencarian.
  if (query.photographer) {
    where.photographer = query.photographer;
  }

  if (query.period) {
    const DAY = 24 * 60 * 60 * 1000;
    const span = { day: DAY, week: 7 * DAY, month: 30 * DAY, year: 365 * DAY }[query.period];
    where.createdAt = { gte: new Date(Date.now() - span) };
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
    // Pencarian = JUDUL (ID & EN), NAMA FOTOGRAFER, atau KEYWORD (ID & EN).
    where.OR = [
      {
        title: {
          contains: query.search,
        },
      },
      {
        titleEn: {
          contains: query.search,
        },
      },
      {
        photographer: {
          contains: query.search,
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
                lang: true,
              },
            },
          },
        },
      },
      orderBy:
        query.sort === "price_asc"
          ? { price: "asc" }
          : query.sort === "price_desc"
            ? { price: "desc" }
            : query.sort === "oldest"
              ? { createdAt: "asc" }
              : query.sort === "popular"
                ? [{ downloads: { _count: "desc" } }, { favorites: { _count: "desc" } }, { createdAt: "desc" }]
                : { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.photo.count({ where }),
  ]);

    const formattedPhotos = await Promise.all(photos.map((p) => mapPhotoRow(p)));

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
      if (process.env.NODE_ENV !== "production") console.log("CACHE HIT for photo:", id);
      return JSON.parse(cached);
    }

    if (process.env.NODE_ENV !== "production") console.log("CACHE MISS for photo:", id);

    // Query dari database
    const photo = await prisma.photo.findUnique({
      where: {
        id,
        deletedAt: null,
        status: "APPROVED",
      },
      include: {
        // id WAJIB ikut — Dashboard edit page (apps/cms) memetakan pk.keyword.id
        // ke selectedKeywords. Tanpa id, semua key jadi undefined → React warning
        // "Each child in a list should have a unique key prop" di KeywordInput.
        photoCategories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        photoKeywords: {
          select: {
            keyword: {
              select: {
                id: true,
                name: true,
                lang: true,
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
      // File yatim (NotFound/NoSuchKey) sudah dicatat sekali per key oleh
      // getPresignedUrl; hanya error lain yang dicatat penuh.
      const code = (urlErr as { code?: string })?.code;
      if (code !== "NotFound" && code !== "NoSuchKey" && code !== "NoSuchBucket") {
        console.error("Failed to generate presigned URLs:", urlErr);
      }
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
    const assets = await buildPhotoAssets(file.buffer, file.mimetype, watermark, existingPhoto.id);
    updateData.originalKey = assets.originalKey;
    updateData.thumbKey = assets.thumbKey;
    updateData.watermarkKey = assets.watermarkKey;
    updateData.width = assets.width;
    updateData.height = assets.height;
    updateData.format = assets.format;
  } else if (watermark) {
    // Watermark sekarang selalu di-generate dari logo bundel (tile + skew) di
    // buildPhotoAssets, jadi upload watermark terpisah tanpa re-upload foto
    // tidak lagi berdampak. Abaikan field ini; watermark hanya berubah bila
    // foto di-upload ulang lewat `file`.
    console.warn(
      "[photo] update dengan field `watermark` tanpa `file` diabaikan — " +
        "watermark di-generate otomatis dari logo bundel.",
    );
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
  if (process.env.NODE_ENV !== "production") console.log("CACHE INVALIDATED for photo:", id);

  return updatedPhoto;
}

// service untuk GET /photos/:id/related
/**
 * Saran lokasi untuk form unggah: gabungan lokasi yang sudah dipakai di foto
 * APPROVED (terurut populer) + referensi geografi Indonesia statis
 * (utils/indonesiaPlaces.ts). Tanpa q → terpopuler dulu; dengan q → yang
 * cocok dulu (DB didahulukan). Publik, ringan, tanpa auth.
 */
export async function getPhotoLocationsService(
  limit = 100,
  q?: string,
): Promise<string[]> {
  const query = (q ?? "").trim().toLowerCase();
  const cap = Math.max(1, Math.min(300, limit));

  const rows = await prisma.photo.groupBy({
    by: ["location"],
    where: {
      deletedAt: null,
      status: "APPROVED",
      location: { not: null },
      ...(query ? { location: { contains: query } } : {}),
    },
    _count: { location: true },
    orderBy: { _count: { location: "desc" } },
    take: cap,
  });
  const dbNames = rows
    .map((r) => (r.location ?? "").trim())
    .filter((loc) => loc.length > 0);
  const seen = new Set(dbNames.map((n) => n.toLowerCase()));

  // Pelengkap statis: yang cocok q (atau semua bila tanpa q), belum ada di DB.
  const staticNames = INDONESIA_PLACES.filter((name) => {
    if (seen.has(name.toLowerCase())) return false;
    return !query || name.toLowerCase().includes(query);
  });

  return [...dbNames, ...staticNames].slice(0, cap);
}


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
              lang: true,
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
  // ID dibuat di sini (bukan default DB) supaya pita kredit aset publik
  // memuat ID yang sama dengan baris foto.
  const photoId = crypto.randomUUID();
  const assets = await buildPhotoAssets(
    data.file.buffer,
    data.file.mimetype,
    data.watermark,
    photoId,
  );

  const status = data.role === "CONTRIBUTOR" ? "PENDING" : "APPROVED";

  // upload ke db
  const createData: Prisma.PhotoCreateInput = {
    id: photoId,
    title: data.title,

    description: data.description ?? null,
    titleEn: data.titleEn ?? null,
    descriptionEn: data.descriptionEn ?? null,

    photographer: data.photographer,
    location: data.location ?? null,
    batchId: data.batchId ?? null,
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

  // Invalidate cache best-effort: bila Redis error, foto tetap berhasil
  // di-create; jangan biarkan error di sini mengembalikan HTTP error ke client.
  try {
    const keys = await redisClient.keys("v4:photos:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error("[photo] cache invalidation failed after create, ignoring:", err);
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
  ownerId?: string,
) {
  // Cek photo exists
  const photo = await prisma.photo.findUnique({
    where: { id: photoId, deletedAt: null },
  });

  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
  }

  // Kontributor hanya boleh menandai karyanya sendiri; admin bebas.
  if (ownerId && photo.userId !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Bukan karya milikmu");
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
  ownerId?: string,
) {
  // Cek photo exists
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
  }

  // Kontributor hanya boleh menandai karyanya sendiri; admin bebas.
  if (ownerId && photo.userId !== ownerId) {
    throw new AppError(403, "FORBIDDEN", "Bukan karya milikmu");
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

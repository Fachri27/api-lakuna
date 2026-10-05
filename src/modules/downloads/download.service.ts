import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { SubscriptionStatus, LicenseType } from "@prisma/client";
import { redisClient } from "../../config/redis.js";

export async function getDownloadService(userId: string, query?: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query?.page || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(query?.limit || "20")));
  const skip = (page - 1) * limit;

  const [licenses, total] = await Promise.all([
    prisma.license.findMany({
      where: {
        userId,
      },

      include: {
        photo: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            thumbKey: true,
            watermarkKey: true,
            originalKey: true,
            photographer: true,
            price: true,
          },
        },

        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: limit,
    }),
    prisma.license.count({ where: { userId } }),
  ]);

  // Format with presigned URLs
  const formattedLicenses = await Promise.all(
    licenses.map(async (license) => {
      // Relasi photo opsional: tanpa guard, spread `...license.photo` error
      // TS18047 saat strict (Railway build).
      const lp = license.photo;
      if (!lp) return { ...license, photo: null };
      let thumbUrl = null;
      let watermarkUrl = null;
      try {
        if (lp.thumbKey) thumbUrl = await getPresignedUrl(lp.thumbKey);
        if (lp.watermarkKey) watermarkUrl = await getPresignedUrl(lp.watermarkKey);
      } catch {
        // Silent fail - fallback to picsum
      }
      return {
        ...license,
        photo: {
          ...lp,
          thumbUrl: thumbUrl || `https://picsum.photos/seed/${lp.id}/400/300`,
          watermarkUrl: watermarkUrl || `https://picsum.photos/seed/${lp.id}/800/600`,
        },
      };
    }),
  );

  return {
    licenses: formattedLicenses,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function downloadPhotoService(data: {
   userId: string;
   photoId: string;
 }) {
   const photo = await prisma.photo.findUnique({
     where: { id: data.photoId },
   });

   if (!photo) {
     throw new AppError(404, "PHOTO_NOT_FOUND", "Photo tidak ditemukan");
   }

   // Cek license STANDAR dulu (per-foto)
   const standardLicense = await prisma.license.findFirst({
     where: {
       userId: data.userId,
       photoId: data.photoId,
       type: LicenseType.STANDAR,
     },
     include: {
       photo: true,
     },
   });

    if (standardLicense) {
      const lp = standardLicense.photo;
      if (!lp?.originalKey) {
        throw new AppError(500, "DOWNLOAD_FAILED", "Gagal membuat link download, coba lagi nanti");
      }
      // Catat setiap unduhan sukses — dibaca settlement earning
      await prisma.download.create({
        data: {
          userId: data.userId,
          photoId: data.photoId,
          licenseId: standardLicense.id,
        },
      });
      // Jika ada license STANDAR, langsung bisa download
      let url: string;
      try {
        url = await getPresignedUrl(lp.originalKey, 3600, "attachment");
      } catch {
        throw new AppError(500, "DOWNLOAD_FAILED", "Gagal membuat link download, coba lagi nanti");
      }
      return url;
    }

   // Jika tidak ada license STANDAR, cek apakah user punya SUBSCRIBE
   const subscription = await prisma.subscription.findUnique({
     where: { userId: data.userId },
   });

   if (!subscription) {
     throw new AppError(403, "NO_LICENSE", "Anda tidak memiliki license");
   }

    // Validasi subscription
    const now = new Date();
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new AppError(403, "SUBSCRIPTION_INACTIVE", "Subscription Anda tidak aktif");
    }
    if (subscription.expiresAt < now) {
      throw new AppError(403, "SUBSCRIPTION_EXPIRED", "Subscription Anda sudah kadaluarsa");
    }

    // Cek quota dan increment atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Re-check subscription with lock
      const sub = await tx.subscription.findUnique({
        where: { userId: data.userId },
      });

      if (!sub) {
        throw new AppError(403, "NO_SUBSCRIPTION", "Anda tidak memiliki subscription aktif");
      }

      if (sub.status !== SubscriptionStatus.ACTIVE) {
        throw new AppError(403, "SUBSCRIPTION_INACTIVE", "Subscription Anda tidak aktif");
      }

      // Check apakah subscription sudah kadaluarsa
      const now = new Date();
      if (sub.expiresAt < now) {
        throw new AppError(403, "SUBSCRIPTION_EXPIRED", "Subscription Anda sudah kadaluarsa");
      }

// Create per-photo subscription license record if not already created
      const existingSubLicense = await tx.license.findFirst({
        where: {
          userId: data.userId,
          photoId: data.photoId,
          type: LicenseType.SUBSCRIBE,
        },
      });

      if (existingSubLicense) {
        // Re-download: jangan increment kuota lagi, langsung catat Download
        await tx.download.create({
          data: {
            userId: data.userId,
            photoId: data.photoId,
            licenseId: existingSubLicense.id,
          },
        });
        return existingSubLicense;
      }

      // Klaim kuota atomik: hanya berhasil bila used < quota
      const claimed = await tx.subscription.updateMany({
        where: { userId: data.userId, used: { lt: sub.quota } },
        data: { used: { increment: 1 } },
      });

      if (claimed.count === 0) {
        throw new AppError(403, "QUOTA_EXCEEDED", "Kuota subscription Anda sudah habis");
      }

      const newLicense = await tx.license.create({
        data: {
          userId: data.userId,
          photoId: data.photoId,
          type: LicenseType.SUBSCRIBE,
          expiresAt: sub.expiresAt,
        },
      });

      await tx.download.create({
        data: {
          userId: data.userId,
          photoId: data.photoId,
          licenseId: newLicense.id,
        },
      });

      // Atomic increment
      return await tx.subscription.findUniqueOrThrow({
        where: { userId: data.userId },
      });
    });

    // Get photo to download

   // Generate presigned URL
   let url: string;
   try {
     url = await getPresignedUrl(photo.originalKey, 3600, "attachment");
   } catch {
     throw new AppError(500, "DOWNLOAD_FAILED", "Gagal membuat link download, coba lagi nanti");
   }

   return url;
}
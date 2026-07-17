import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { LicenseType } from "@prisma/client";
export async function getDownloadService(userId, query) {
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
    const formattedLicenses = await Promise.all(licenses.map(async (license) => {
        let thumbUrl = null;
        let watermarkUrl = null;
        if (license.photo) {
            try {
                if (license.photo.thumbKey)
                    thumbUrl = await getPresignedUrl(license.photo.thumbKey);
                if (license.photo.watermarkKey)
                    watermarkUrl = await getPresignedUrl(license.photo.watermarkKey);
            }
            catch {
                // Silent fail - fallback to picsum
            }
        }
        return {
            ...license,
            photo: license.photo ? {
                ...license.photo,
                thumbUrl: thumbUrl || `https://picsum.photos/seed/${license.photo.id}/400/300`,
                watermarkUrl: watermarkUrl || `https://picsum.photos/seed/${license.photo.id}/800/600`,
            } : null,
        };
    }));
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
export async function downloadPhotoService(data) {
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
    if (standardLicense && standardLicense.photo) {
        // Jika ada license STANDAR, langsung bisa download
        let url;
        try {
            url = await getPresignedUrl(standardLicense.photo.originalKey);
        }
        catch {
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
        // Check apakah subscription sudah kadaluarsa
        const now = new Date();
        if (sub.expiresAt < now) {
            throw new AppError(403, "SUBSCRIPTION_EXPIRED", "Subscription Anda sudah kadaluarsa");
        }
        // Check quota
        if (sub.used >= sub.quota) {
            throw new AppError(403, "QUOTA_EXCEEDED", "Kuota subscription Anda sudah habis");
        }
        // Create per-photo subscription license record if not already created
        const existingSubLicense = await tx.license.findFirst({
            where: {
                userId: data.userId,
                photoId: data.photoId,
                type: LicenseType.SUBSCRIBE,
            },
        });
        if (!existingSubLicense) {
            await tx.license.create({
                data: {
                    userId: data.userId,
                    photoId: data.photoId,
                    type: LicenseType.SUBSCRIBE,
                    expiresAt: sub.expiresAt,
                },
            });
        }
        // Atomic increment
        return await tx.subscription.update({
            where: { userId: data.userId },
            data: { used: { increment: 1 } },
        });
    });
    // Get photo to download
    // Generate presigned URL
    let url;
    try {
        url = await getPresignedUrl(photo.originalKey);
    }
    catch {
        throw new AppError(500, "DOWNLOAD_FAILED", "Gagal membuat link download, coba lagi nanti");
    }
    return url;
}
//# sourceMappingURL=download.service.js.map
import { prisma } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getPresignedUrl } from "../../config/minio.js";
// get 
export async function getFavoriteService(userId) {
    const cacheKey = `favorite:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    // query ke db
    const favorite = await prisma.favorite.findMany({
        where: {
            userId: userId,
        },
        include: {
            photo: {
                select: {
                    id: true,
                    title: true,
                    thumbKey: true,
                    price: true,
                    type: true,
                    photographer: true,
                    watermarkKey: true,
                },
            },
        },
    });
    // Generate presigned URLs for each favorite
    const formattedFavorites = await Promise.all(favorite.map(async (fav) => {
        let thumbUrl = null;
        let watermarkUrl = null;
        try {
            if (fav.photo?.thumbKey)
                thumbUrl = await getPresignedUrl(fav.photo.thumbKey);
            if (fav.photo?.watermarkKey)
                watermarkUrl = await getPresignedUrl(fav.photo.watermarkKey);
        }
        catch (urlErr) {
            // Silent fail - fallback to picsum
        }
        return {
            ...fav,
            photo: {
                ...fav.photo,
                thumbUrl: thumbUrl || `https://picsum.photos/seed/${fav.photo?.id}/400/300`,
                watermarkUrl: watermarkUrl || `https://picsum.photos/seed/${fav.photo?.id}/800/600`,
            },
        };
    }));
    // save cached
    await redisClient.set(cacheKey, JSON.stringify(formattedFavorites), "EX", 60 * 5);
    return formattedFavorites;
}
// add favorite
export async function addFavoriteService(data) {
    const photo = await prisma.photo.findFirst({
        where: {
            id: data.photoId,
            deletedAt: null
        },
    });
    if (!photo) {
        throw new AppError(404, "PHOTO_NOT_FOUND", "Photo tidak di temukan");
    }
    // menhindari duplicate
    const existing = await prisma.favorite.findFirst({
        where: {
            userId: data.userId,
            photoId: data.photoId,
        },
    });
    if (existing) {
        throw new AppError(409, "ALREADY_FAVORITE", "Foto sudah difavorite");
    }
    // save db
    const favorite = await prisma.favorite.create({
        data: {
            userId: data.userId,
            photoId: data.photoId,
        },
        include: {
            photo: {
                select: {
                    id: true,
                    title: true,
                    thumbKey: true,
                    price: true,
                    type: true,
                    photographer: true,
                    watermarkKey: true,
                },
            },
        },
    });
    // Generate presigned URLs
    let thumbUrl = null;
    let watermarkUrl = null;
    try {
        if (favorite.photo?.thumbKey)
            thumbUrl = await getPresignedUrl(favorite.photo.thumbKey);
        if (favorite.photo?.watermarkKey)
            watermarkUrl = await getPresignedUrl(favorite.photo.watermarkKey);
    }
    catch {
        // Silent fail - fallback to picsum
    }
    const formattedFavorite = {
        ...favorite,
        photo: {
            ...favorite.photo,
            thumbUrl: thumbUrl || `https://picsum.photos/seed/${favorite.photo?.id}/400/300`,
            watermarkUrl: watermarkUrl || `https://picsum.photos/seed/${favorite.photo?.id}/800/600`,
        },
    };
    // invalidate cache
    await redisClient.del(`favorite:${data.userId}`);
    return formattedFavorite;
}
// delete
export async function deleteFavoriteService(data) {
    // cek ownership
    const isOwner = await prisma.favorite.findFirst({
        where: {
            id: data.favId,
            userId: data.userId
        },
    });
    if (!isOwner) {
        throw new AppError(404, "FAVORITE_NOT_FOUND", "Favorite tidak ditemukan");
    }
    await prisma.favorite.delete({
        where: {
            id: data.favId,
        },
    });
    await redisClient.del(`favorite:${data.userId}`);
    return true;
}
//# sourceMappingURL=favorite.service.js.map
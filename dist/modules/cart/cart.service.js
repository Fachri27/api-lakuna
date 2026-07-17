import { prisma } from "../../config/db.js";
import { redisClient } from "../../config/redis.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getPresignedUrl } from "../../config/minio.js";
// get cart
export async function getCartService(userId) {
    const cacheKey = `cart:${userId}`;
    // cek cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    // query db
    const cart = await prisma.cartItem.findMany({
        where: {
            userId,
        },
        include: {
            photo: {
                select: {
                    id: true,
                    title: true,
                    thumbKey: true,
                    price: true,
                },
            },
        },
    });
    const formattedPhotos = await Promise.all(cart.map(async (item) => {
        let thumbUrl = null;
        try {
            if (item.photo.thumbKey) {
                thumbUrl = await getPresignedUrl(item.photo.thumbKey);
            }
        }
        catch (urlErr) {
            console.error("Failed to generate presigned URLs for item:", item.photo.id);
        }
        const price = item.license === "SUBSCRIBE" ? 0 : item.photo.price;
        return {
            ...item,
            price,
            thumbUrl: thumbUrl || `https://picsum.photos/seed/${item.photo.id}/400/300`,
        };
    }));
    await redisClient.set(cacheKey, JSON.stringify(formattedPhotos), "EX", 60 * 5);
    return formattedPhotos;
}
// add cart
export async function addToCartService(data) {
    // cek photo
    const photo = await prisma.photo.findFirst({
        where: {
            id: data.photoId,
            deletedAt: null,
        },
    });
    if (!photo) {
        throw new AppError(404, "PHOTO_NOT_FOUND", "Photo tidak di temukan");
    }
    // Create with transaction to handle race condition
    const cart = await prisma.$transaction(async (tx) => {
        // cek kalo ada duplicate cart (within transaction)
        const existing = await tx.cartItem.findFirst({
            where: {
                userId: data.userId,
                photoId: data.photoId,
                license: data.license,
            },
        });
        if (existing) {
            throw new AppError(409, "PHOTO_DUPLICATE", "Foto sudah ada di cart");
        }
        // create
        return await tx.cartItem.create({
            data: {
                userId: data.userId,
                photoId: data.photoId,
                license: data.license,
            },
            include: {
                photo: {
                    select: {
                        id: true,
                        title: true,
                        thumbKey: true,
                        price: true,
                    },
                },
            },
        });
    });
    // invalidate cache
    await redisClient.del(`cart:${data.userId}`);
    let thumbUrl = null;
    try {
        if (cart.photo.thumbKey) {
            thumbUrl = await getPresignedUrl(cart.photo.thumbKey);
        }
    }
    catch (urlErr) {
        console.error("Failed to generate presigned URLs for item:", cart.photo.id);
    }
    const price = cart.license === "SUBSCRIBE" ? 0 : cart.photo.price;
    return {
        ...cart,
        price,
        thumbUrl: thumbUrl || `https://picsum.photos/seed/${cart.photo.id}/400/300`,
    };
}
// delete cart
export async function deleteCartService(data) {
    // cek kalo ini emang si user
    const cart = await prisma.cartItem.findFirst({
        where: {
            id: data.cartId,
            userId: data.userId,
        },
    });
    if (!cart) {
        throw new AppError(404, "CART_NOT_FOUND", "Cart tidak di temukan");
    }
    // delete
    await prisma.cartItem.delete({
        where: {
            id: data.cartId,
        },
    });
    // invalidate cache
    await redisClient.del(`cart:${data.userId}`);
    return true;
}
//# sourceMappingURL=cart.service.js.map
import { prisma } from "../../config/db.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { redisClient } from "../../config/redis.js";
import sharp from "sharp";
import { minioClient } from "../../config/minio.js";
import { uploadBuffer } from "../../utils/uploadToMinio.js";
// Admin: Get all users
export async function getAllUsersService(query) {
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "20")));
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return {
        users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
export async function updateUserService(data) {
    // cek existing user
    const user = await prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User tidak di temukan");
    }
    if (data.username && data.username !== user.username) {
        const userTaken = await prisma.user.findUnique({
            where: {
                username: data.username,
            },
        });
        if (userTaken) {
            throw new AppError(409, "USERNAME_TAKEN", "Username sudah di pakai");
        }
    }
    if (user.deletedAt) {
        throw new AppError(404, "ACCOUNT_DELETED", "Akun sudah di hapus");
    }
    const updateUser = {};
    if (data.username !== undefined) {
        updateUser.username = data.username;
    }
    if (data.realName !== undefined) {
        updateUser.realName = data.realName;
    }
    if (data.newsletter !== undefined) {
        updateUser.newsletter = data.newsletter;
    }
    // save ke db
    const saveUser = await prisma.user.update({
        where: {
            id: data.userId,
            deletedAt: null,
        },
        data: updateUser,
        select: {
            id: true,
            username: true,
            email: true,
            realName: true,
            avatarKey: true,
            newsletter: true,
            role: true,
        },
    });
    await redisClient.del(`user:me:${data.userId}`);
    return saveUser;
}
// get user/me
export async function getMeService(userId) {
    const cacheKey = `user:me:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    // query db
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
            deletedAt: null,
        },
        select: {
            id: true,
            username: true,
            email: true,
            realName: true,
            avatarKey: true,
            newsletter: true,
            role: true,
            createdAt: true,
            subscription: {
                select: {
                    quota: true,
                    used: true,
                    status: true,
                    expiresAt: true,
                },
            },
        },
    });
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User tidak di temukan");
    }
    await redisClient.set(cacheKey, JSON.stringify(user), "EX", 60 * 5);
    return user;
}
// update avatar
export async function updateAvatarMeService(data) {
    const user = await prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User tidak di temukan");
    }
    if (user.deletedAt) {
        throw new AppError(404, "ACCOUNT_DELETED", "Akun sudah di hapus");
    }
    // resize image
    const avatarBuffer = await sharp(data.file.buffer)
        .resize(300, 300)
        .jpeg({
        quality: 80,
    })
        .toBuffer();
    const avatarKey = `avatars/${data.userId}-${Date.now()}.jpg`;
    await uploadBuffer(avatarKey, avatarBuffer, "image/jpeg");
    if (user.avatarKey) {
        try {
            await minioClient.removeObject(process.env.MINIO_BUCKET ?? "", user.avatarKey);
        }
        catch (err) {
            // Old avatar cleanup is best-effort
        }
    }
    const updateUser = await prisma.user.update({
        where: {
            id: data.userId,
            deletedAt: null,
        },
        data: {
            avatarKey,
        },
        select: {
            id: true,
            username: true,
            avatarKey: true,
        },
    });
    await redisClient.del(`user:me:${data.userId}`);
    return updateUser;
}
// delete
export async function deleteMeService(data) {
    // cek user
    const user = await prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User tidak di temukan");
    }
    if (user.deletedAt) {
        throw new AppError(404, "ACCOUNT_DELETED", "Akun sudah di hapus");
    }
    // soft delete
    const softDelete = await prisma.user.update({
        where: {
            id: data.userId,
        },
        data: {
            deletedAt: new Date(),
        },
    });
    // blacklist token
    if (data.accessToken) {
        await redisClient.set(`blacklist:${data.accessToken}`, "true", "EX", 60 * 15);
    }
    // hapus refresh token
    await redisClient.del(`refreshToken:${data.userId}`);
    // invalidate token
    await redisClient.del(`user:me:${data.userId}`);
    return softDelete;
}
// Admin: Update user role
export async function updateUserRoleService(userId, role) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
            deletedAt: null,
        },
    });
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User tidak ditemukan");
    }
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            role: role,
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
        },
    });
    await redisClient.del(`user:me:${userId}`);
    return updatedUser;
}
//# sourceMappingURL=user.service.js.map
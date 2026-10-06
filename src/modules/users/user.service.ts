import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/errorHandler.js";
import bcrypt from "bcryptjs";
import { uploadFileBuffer, cleanUploadFile } from "../../middlewares/upload.js";
import { redisClient } from "../../config/redis.js";
import sharp from "sharp";
import { minioClient, getPresignedUrl } from "../../config/minio.js";
import { uploadBuffer } from "../../utils/uploadToMinio.js";

type updateUserInput = {
  userId: string;
  username?: string;
  realName?: string;
  newsletter?: boolean;
};

type updateAvatars = {
  userId: string;
  file: Express.Multer.File;
};

// Admin: Get all users
export async function getAllUsersService(query: {
  page?: string;
  limit?: string;
}) {
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

export async function updateUserService(data: updateUserInput) {
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
    const userTaken = await prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: { id: data.userId },
      },
    });

    if (userTaken) {
      throw new AppError(409, "USERNAME_TAKEN", "Username sudah di pakai");
    }
  }

  if (user.deletedAt) {
    throw new AppError(404, "ACCOUNT_DELETED", "Akun sudah di hapus");
  }

  const updateUser: Prisma.UserUpdateInput = {};

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

  return {
    ...saveUser,
    avatarUrl: saveUser.avatarKey ? await getPresignedUrl(saveUser.avatarKey) : null,
  };
}

// get user/me
export async function getMeService(userId: string, bypassCache = false) {
  const cacheKey = `user:me:${userId}`;

  if (!bypassCache) {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        avatarUrl: parsed.avatarKey ? await getPresignedUrl(parsed.avatarKey) : null,
      };
    }
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

  return {
    ...user,
    avatarUrl: user.avatarKey ? await getPresignedUrl(user.avatarKey) : null,
  };
}

// update avatar
export async function updateAvatarMeService(data: updateAvatars) {
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
  let avatarBuffer: Buffer;
  try {
    avatarBuffer = await sharp(uploadFileBuffer(data.file))
      .resize(300, 300)
      .jpeg({
        quality: 80,
      })
      .toBuffer();
    cleanUploadFile(data.file);
  } catch {
    throw new AppError(400, "INVALID_IMAGE", "File tidak dapat diproses sebagai gambar. Pastikan file adalah gambar yang valid.");
  }

  const avatarKey = `avatars/${data.userId}-${Date.now()}.jpg`;

  await uploadBuffer(avatarKey, avatarBuffer, "image/jpeg");

  if (user.avatarKey) {
    try {
      await minioClient.removeObject(
        process.env.MINIO_BUCKET ?? "",
        user.avatarKey,
      );
    } catch (err) {
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

  return {
    ...updateUser,
    avatarUrl: updateUser.avatarKey ? await getPresignedUrl(updateUser.avatarKey) : null,
  };
}

// delete
export async function deleteMeService(data: {
  userId: string;
  accessToken?: string;
}) {
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
    await redisClient.set(
      `blacklist:${data.accessToken}`,
      "true",
      "EX",
      60 * 15,
    );
  }

  // hapus refresh token
  await redisClient.del(`refreshToken:${data.userId}`);

  // invalidate token
  await redisClient.del(`user:me:${data.userId}`);

  return softDelete;
}

// change password: verify current with bcrypt compare, hash new with bcrypt
export async function changePasswordService(data: {
  userId: string;
  current: string;
  newPassword: string;
}) {
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

  const isMatch = await bcrypt.compare(data.current, user.password);

  if (!isMatch) {
    throw new AppError(401, "INVALID_CURRENT_PASSWORD", "Password saat ini salah");
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: {
      id: data.userId,
      deletedAt: null,
    },
    data: {
      password: hashedPassword,
    },
  });

  await redisClient.del(`user:me:${data.userId}`);

  return { id: data.userId };
}

// newsletter opt-in/out (dedicated endpoint, thin wrapper over User.newsletter)
export async function updateNewsletterService(data: {
  userId: string;
  active: boolean;
}) {
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

  const saveUser = await prisma.user.update({
    where: {
      id: data.userId,
      deletedAt: null,
    },
    data: {
      newsletter: data.active,
    },
    select: {
      id: true,
      username: true,
      email: true,
      newsletter: true,
    },
  });

  await redisClient.del(`user:me:${data.userId}`);

  return saveUser;
}

// Admin: Update user role
export async function updateUserRoleService(targetUserId: string, role: "USER" | "ADMIN" | "CONTRIBUTOR", actorUserId?: string) {
    // Self-demote guard: admin tidak boleh mengubah role dirinya sendiri
    if (actorUserId && targetUserId === actorUserId) {
        throw new AppError(403, "CANNOT_CHANGE_OWN_ROLE", "Tidak dapat mengubah role sendiri");
    }

    const userId = targetUserId;
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
            role: role as any,
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

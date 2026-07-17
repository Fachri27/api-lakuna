import bcrypt from "bcryptjs";
import { AppError } from "../../middlewares/errorHandler.js";
import { prisma } from "../../config/db.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../../utils/jwt.js";
import { redisClient } from "../../config/redis.js";


type RegisterInput = {
    email: string;
    username: string;
    password: string;
};

type LoginInput = {
    email: string;
    password: string;
}


export async function registerService(
    data: RegisterInput
) {
    // cek email sudah terdaftar atau belum
    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new AppError(
            409,
            "Email already registered",
            "Email sudah terdaftar"
        );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // simpan user baru ke database
    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            username: data.username,
            password: hashedPassword,
        }, 

        select: {
            id: true,
            email: true, 
            username: true,
        },
    });


    return newUser;

}


// service login
export async function loginService(
    data: LoginInput
) {

    // cek email dan password
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
            deletedAt: null
        }
    });

    if(!user) {
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Email atau Password salah"
        );
    }

    // compare password
    const isMatch = await bcrypt.compare(
        data.password,
        user.password
    );

    if(!isMatch) {
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Email atau Password salah"
        );
    }

    // generate access token
    const accessToken = signAccessToken({
        userId: user.id,
        role: user.role
    });

    // refresh token
    const refreshToken = signRefreshToken({
        userId: user.id,
    });

    // simpan refresh ke redis
    await redisClient.set(
        `refreshToken:${user.id}`,
        refreshToken,
        "EX",
        60 * 60 * 24 * 7
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
    };
    
}


// logout 
export async function logoutService(
    accessToken: string
) {
    // verify access token
    const payload = verifyAccessToken(accessToken) as { userId: string };

    // hapus refresh token
    await redisClient.del(
        `refreshToken:${payload.userId}`,
    );

    // blacklist refresh token
    await redisClient.set(
        `blacklist:${accessToken}`,
        "true",
        "EX",
        60 * 15
    );

    return true;
}

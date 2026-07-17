import { NextFunction, Request, Response } from "express";
import { addFavoriteService, deleteFavoriteService, getFavoriteService } from "./favorite.service.js";
import { AppError } from "../../middlewares/errorHandler.js";


export async function getFavoriteController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const favorite = await getFavoriteService(
            (req.user as { userId: string })!.userId
        );

        return res.json({
            success: true,
            data: favorite,
        });

    } catch(err) {
        next(err);
    }
}


export async function addFavoriteController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const favorite = await addFavoriteService({
            userId: (req.user as { userId: string })!.userId,
            photoId: req.body.photoId,
        });

        return res.status(201).json({
            success: true,
            data: favorite,
        });

    } catch(err) {
        next(err);
    }
}


export async function deleteFavoriteController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const { id } = req.params;

        if(!id || Array.isArray(id)) {
            throw new AppError(
                404,
                "INVALID_ID",
                "Photo tidak di ketahui",
            );
        }

        await deleteFavoriteService({
            userId: (req.user as { userId: string })!.userId,
            favId: id,
        });

        res.json({
            success: false,
            message: "Favorite telah di hapus",
        });

    } catch(err) {
        next(err);
    }
}
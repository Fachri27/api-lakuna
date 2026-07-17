import { addFavoriteService, deleteFavoriteService, getFavoriteService } from "./favorite.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
export async function getFavoriteController(req, res, next) {
    try {
        const favorite = await getFavoriteService(req.user.userId);
        return res.json({
            success: true,
            data: favorite,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function addFavoriteController(req, res, next) {
    try {
        const favorite = await addFavoriteService({
            userId: req.user.userId,
            photoId: req.body.photoId,
        });
        return res.status(201).json({
            success: true,
            data: favorite,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function deleteFavoriteController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(404, "INVALID_ID", "Photo tidak di ketahui");
        }
        await deleteFavoriteService({
            userId: req.user.userId,
            favId: id,
        });
        res.json({
            success: false,
            message: "Favorite telah di hapus",
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=favorite.controller.js.map
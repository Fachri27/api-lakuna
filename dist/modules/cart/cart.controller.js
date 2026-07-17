import { addToCartService, deleteCartService, getCartService } from "./cart.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
// get
export async function getCartController(req, res, next) {
    try {
        const cart = await getCartService(req.user.userId);
        return res.json({
            success: true,
            data: cart,
        });
    }
    catch (err) {
        next(err);
    }
}
// create
export async function addToCartController(req, res, next) {
    try {
        const cart = await addToCartService({
            userId: req.user.userId,
            photoId: req.body.photoId,
            license: req.body.license,
        });
        return res.json({
            success: true,
            data: cart,
        });
    }
    catch (err) {
        next(err);
    }
}
// delete
export async function deleteCartController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(404, "INVALID_ID", "ID tidak valid");
        }
        await deleteCartService({
            userId: req.user.userId,
            cartId: id,
        });
        return res.json({
            success: true,
            message: "Cart berhasil di hapus"
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=cart.controller.js.map
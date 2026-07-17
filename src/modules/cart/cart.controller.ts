import { NextFunction, Request, Response } from "express";
import { addToCartService, deleteCartService, getCartService } from "./cart.service.js";
import { AppError } from "../../middlewares/errorHandler.js";


// get
export async function getCartController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const cart = await getCartService(
            (req.user as { userId: string })!.userId
        );

        return res.json({
            success: true,
            data: cart,
        });

    } catch(err) {
        next(err);
    }
}


// create
export async function addToCartController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try{

        const cart = await addToCartService({
            userId: (req.user as { userId: string })!.userId,
            photoId: req.body.photoId,
            license: req.body.license,
        });

        return res.json({
            success: true,
            data: cart,
        });

    } catch(err) {
        next(err);
    }
}

// delete
export async function deleteCartController(
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
                "ID tidak valid"
            );
        }

        await deleteCartService({
            userId: (req.user as { userId: string })!.userId,
            cartId: id,
        });

        return res.json({
            success: true,
            message: "Cart berhasil di hapus"
        });

    } catch(err) {
        next(err);
    }
}
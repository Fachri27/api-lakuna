import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { addToCartController, deleteCartController, getCartController } from "./cart.controller.js";
import { validate } from "../../middlewares/validate.js";
import { AddToCartSchema } from "./cart.schema.js";


const routerCart = Router();

routerCart.get(
    "/",
    authMiddleware,
    getCartController,
);

routerCart.post(
    "/",
    authMiddleware,
    validate(AddToCartSchema),
    addToCartController,
);

routerCart.delete(
    "/:id",
    authMiddleware,
    deleteCartController,
);

export default routerCart;
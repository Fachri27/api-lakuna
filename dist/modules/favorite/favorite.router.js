import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { addFavoriteController, deleteFavoriteController, getFavoriteController } from "./favorite.controller.js";
import { validate } from "../../middlewares/validate.js";
import { addFavoriteSchema } from "./favorite.schema.js";
const routerFavorite = Router();
routerFavorite.get("/", authMiddleware, getFavoriteController);
routerFavorite.post("/", authMiddleware, validate(addFavoriteSchema), addFavoriteController);
routerFavorite.delete("/:id", authMiddleware, deleteFavoriteController);
export default routerFavorite;
//# sourceMappingURL=favorite.router.js.map
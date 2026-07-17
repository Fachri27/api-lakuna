import { Router } from "express";
import { loginController, logoutController, refreshController, registerController } from "./auth.controller.js";
import { LoginSchema, RefreshSchema, RegisterSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import { loginRateLimiter, registerRateLimiter } from "../../middlewares/rateLimit.js";
// Import Google controller
import { googleAuthHandler } from "./google.controller.js";
const routerAuth = Router();
routerAuth.post("/register", registerRateLimiter, validate(RegisterSchema), registerController);
routerAuth.post("/login", loginRateLimiter, validate(LoginSchema), loginController);
routerAuth.post("/refresh", validate(RefreshSchema), refreshController);
routerAuth.post("/logout", logoutController);
routerAuth.post("/google", googleAuthHandler);
export default routerAuth;
//# sourceMappingURL=auth.router.js.map
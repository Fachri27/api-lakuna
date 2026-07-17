import { AppError } from "./errorHandler.js";
export const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !roles.includes(role)) {
            return next(new AppError(403, "FORBIDDEN", "Akses ditolak"));
        }
        next();
    };
};
//# sourceMappingURL=role.js.map
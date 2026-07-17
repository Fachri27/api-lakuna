import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./errorHandler.js";

export const roleMiddleware = (...roles: string[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.user?.role;

        if(!role || !roles.includes(role)) {
            return next(
                new AppError(
                    403,
                    "FORBIDDEN",
                    "Akses ditolak"
                )
            );
        }

        next();
    };
};
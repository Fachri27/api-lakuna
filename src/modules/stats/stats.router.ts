import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { prisma } from "../../config/db.js";

const routerStats = Router();

// GET /api/stats/public - Public homepage statistics (no auth)
routerStats.get(
    "/public",
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const [totalPhotos, totalVideos, totalPhotographers, totalCategories] = await Promise.all([
                prisma.photo.count({ where: { deletedAt: null, type: "FOTO" } }),
                prisma.photo.count({ where: { deletedAt: null, type: "VIDEO" } }),
                prisma.photographer.count(),
                prisma.category.count(),
            ]);

            res.json({
                success: true,
                data: {
                    photos: totalPhotos,
                    photographers: totalPhotographers,
                    categories: totalCategories,
                    videos: totalVideos,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/admin/stats - Dashboard statistics
routerStats.get(
    "/stats",
    authMiddleware,
    roleMiddleware("ADMIN"),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [totalPhotos, totalUsers, totalOrders, revenueResult] = await Promise.all([
                prisma.photo.count({ where: { deletedAt: null } }),
                prisma.user.count(),
                prisma.order.count(),
                prisma.order.aggregate({
                    where: { status: "PAID" },
                    _sum: { total: true },
                }),
            ]);

            const totalRevenue = revenueResult._sum.total || 0;

            res.json({
                success: true,
                data: {
                    totalPhotos,
                    totalUsers,
                    totalViews: totalOrders * 10,
                    totalRevenue: `Rp ${(totalRevenue / 1000000).toFixed(1)}M`
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

export default routerStats;
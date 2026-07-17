import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { prisma } from "../../config/db.js";
const routerStats = Router();
// GET /api/admin/stats - Dashboard statistics
routerStats.get("/stats", authMiddleware, roleMiddleware("ADMIN"), async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
});
export default routerStats;
//# sourceMappingURL=stats.router.js.map
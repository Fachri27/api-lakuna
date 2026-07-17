import { prisma } from "../../config/db.js";
import { snap } from "../../config/midtrans.js";
import { AppError } from "../../middlewares/errorHandler.js";
export async function createSubscriptionSnap(data) {
    // Ambil plan dari DB
    const plan = await prisma.plan.findUnique({
        where: { id: data.planId },
    });
    if (!plan)
        throw new AppError(404, "NOT_FOUND", "Plan tidak ditemukan");
    if (!plan.isActive)
        throw new AppError(400, "BAD_REQUEST", "Plan tidak tersedia");
    const price = data.billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, username: true },
    });
    if (!user)
        throw new AppError(404, "NOT_FOUND", "User tidak ditemukan");
    const orderId = `SUB-${Date.now()}`; // Keep under 50 chars - Midtrans limit
    const transaction = await snap.createTransaction({
        transaction_details: {
            order_id: orderId,
            gross_amount: price,
        },
        customer_details: {
            email: user.email,
            first_name: user.username,
        },
        item_details: [
            {
                id: plan.id,
                name: `Subscription ${plan.quota} foto/bulan`,
                price,
                quantity: 1,
            },
        ],
        callbacks: {
            finish: `${process.env.FRONTEND_URL}/payment/finish`,
            unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
            error: `${process.env.FRONTEND_URL}/payment/error`,
        },
    });
    return {
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId,
        price,
        plan,
    };
}
// Standar plan - one time purchase
export async function createStandarSnap(data) {
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, username: true },
    });
    if (!user)
        throw new AppError(404, "NOT_FOUND", "User tidak ditemukan");
    const orderId = `STD-${Date.now()}`;
    const priceSetting = await prisma.setting.findUnique({
        where: { key: "standar_plan_price" },
    });
    const price = priceSetting ? parseInt(priceSetting.value, 10) : 500000;
    const transaction = await snap.createTransaction({
        transaction_details: {
            order_id: orderId,
            gross_amount: price,
        },
        customer_details: {
            email: user.email,
            first_name: user.username,
        },
        item_details: [
            {
                id: "standar-plan",
                name: "Lakuna Foto Standar Plan",
                price,
                quantity: 1,
            },
        ],
        callbacks: {
            finish: `${process.env.FRONTEND_URL}/payment/finish`,
            unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
            error: `${process.env.FRONTEND_URL}/payment/error`,
        },
    });
    return {
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId,
        price,
    };
}
//# sourceMappingURL=subscription.snap.js.map
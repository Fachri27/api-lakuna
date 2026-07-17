import type { SnapTransactionParameters } from "midtrans-client";
import { prisma } from "../../config/db.js";
import { snap } from "../../config/midtrans.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { redisClient } from "../../config/redis.js";
import { getPresignedUrl } from "../../config/minio.js";
import { computeOrderDiscount } from "../discount/discount.service.js";

/** Midtrans Snap accepts more than `@types/midtrans-client` declares */
type SnapCreateTransactionPayload = SnapTransactionParameters & {
  item_details?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  customer_details?: {
    email?: string;
  };
  callbacks?: {
    finish?: string;
    unfinish?: string;
    error?: string;
  };
};

export async function getOrdersService(userId: string) {
    const midtransBaseUrl =
        process.env.MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com/snap/v2/vtweb"
            : "https://app.sandbox.midtrans.com/snap/v2/vtweb";

    const orders = await prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    photo: {
                        select: {
                            id: true,
                            title: true,
                            thumbKey: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Generate thumbUrl for each order's items
    const formattedOrders = await Promise.all(
        orders.map(async (order) => ({
            ...order,
            continuePaymentUrl:
                order.status === "PENDING" && order.midtransToken
                    ? `${midtransBaseUrl}/${order.midtransToken}`
                    : null,
            items: await Promise.all(
                order.items.map(async (item) => {
                    let thumbUrl = null;
                    try {
                        if (item.photo?.thumbKey) {
                            thumbUrl = await getPresignedUrl(item.photo.thumbKey);
                        }
                    } catch {
                        // Silent fail - fallback to picsum
                    }
                    return {
                        ...item,
                        photo: {
                            ...item.photo,
                            thumbUrl: thumbUrl || `https://picsum.photos/seed/${item.photo?.id}/400/300`,
                        },
                    };
                }),
            ),
        })),
    );

    return formattedOrders;
}

export async function getOrdersAdminService(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
                items: {
                    select: {
                        licenseType: true,
                        price: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.order.count(),
    ]);

    const formattedOrders = orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        userName: order.user.username,
        userEmail: order.user.email,
        total: order.total,
        status: order.status,
        license: order.items[0]?.licenseType || undefined,
        createdAt: order.createdAt,
    }));

    return {
        data: formattedOrders,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function createOrderService(
    data: {
        userId: string,
        email?: string,
        voucherCode?: string | undefined,
    }
) {
    // ambil cart
    const cart = await prisma.cartItem.findMany({
        where: {
            userId: data.userId,
        },

        include: {
            photo: true,
        },
    });

    if(cart.length === 0) {
        throw new AppError(
            400,
            "EMPTY_CART",
            "Cart kosong",
        );
    }

    const pricedCart = cart.map((item) => ({
        ...item,
        checkoutPrice: item.license === "SUBSCRIBE" ? 0 : item.photo.price,
    }));

    const subtotal = pricedCart.reduce(
        (sum, item) => sum + item.checkoutPrice,
        0
    );

    if(subtotal <= 0) {
        throw new AppError(
            400,
            "NO_STANDAR_ITEM",
            "Item subscription dibayar melalui paket langganan",
        );
    }

    // ── hitung diskon (ambil terbesar voucher vs event, platform menanggung) ──
    const discount = await computeOrderDiscount({
        userId: data.userId,
        voucherCode: data.voucherCode,
        items: pricedCart.map((item) => ({
            photoId: item.photo.id,
            price: item.checkoutPrice,
            license: item.license,
        })),
    });
    const discountAmount = discount.amount;
    const total = Math.max(0, subtotal - discountAmount);

    return await prisma.$transaction(async (tx) => {
        const createOrder = await tx.order.create({
            data: {
                userId: data.userId,
                total,
                discountAmount,
                voucherId: discount.voucherId ?? null,

                items: {
                    create: cart.map(item => ({
                        photoId: item.photoId,
                        licenseType: item.license,
                        price: item.license === "SUBSCRIBE" ? 0 : item.photo.price,
                    })),
                },
            },

            include: {
                items: true,
            },
        });

        const midtransOrderId = `ORDER-${createOrder.id}`;

        const itemDetails: Array<{ id: string; name: string; quantity: number; price: number }> = pricedCart
            .filter(item => item.checkoutPrice > 0)
            .map(item => ({
                id: item.photo.id,
                name: item.photo.title,
                quantity: 1,
                price: item.checkoutPrice,
            }));

        // Midtrans mensyaratkan sum(item_details.price) == gross_amount.
        // Karena OrderItem tetap di harga list (platform menanggung diskon),
        // tambah baris diskon negatif supaya total cocok.
        if (discountAmount > 0) {
            itemDetails.push({
                id: "DISCOUNT",
                name: discount.source === "VOUCHER" ? `Voucher ${discount.voucherCode ?? ""}`.trim() : (discount.eventName ?? "Event diskon"),
                quantity: 1,
                price: -discountAmount,
            });
        }

        const snapPayload: SnapCreateTransactionPayload = {
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: total,
            },

            item_details: itemDetails,

            customer_details: {
                email: data.email || "customer@example.com",
            },

            callbacks: {
                finish: `${process.env.FRONTEND_URL}/payment/finish`,
                unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
                error: `${process.env.FRONTEND_URL}/payment/error`,
            },
        };

        const snapResponse = await snap.createTransaction(snapPayload);

        await tx.order.update({
            where: {
                id: createOrder.id,
            },

            data: {
                midtransOrderId,
                midtransToken: snapResponse.token,
            },
        });

        return {
            orderId: createOrder.id,
            snapToken: snapResponse.token,
            redirectUrl: snapResponse.redirect_url,
            subtotal,
            discountAmount,
            discountSource: discount.source,
            total,
        };
    });
}
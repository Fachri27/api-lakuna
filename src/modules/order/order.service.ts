import { prisma } from "../../config/db.js";
import { snap } from "../../config/midtrans.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { redisClient } from "../../config/redis.js";
import { getPresignedUrl } from "../../config/minio.js";
import {
  computeOrderDiscount,
  claimVoucherQuota,
  releaseVoucherQuota,
} from "../discount/discount.service.js";
import { withPrismaTxRetry } from "../../utils/prismaRetry.js";

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
                            titleEn: true,
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
        orders.map(async (order) => {
            // midtransToken menyimpan dua hal berbeda:
            //  - order Xendit lama (cart): URL invoice penuh (https://…xendit…/invoices/…)
            //  - order Midtrans (ORDER-/SUB-/STD-): snap token (bukan URL) → perlu base URL snap.
            const token = order.midtransToken;
            const isXenditUrl = !!token && /^https?:\/\//i.test(token);
            // Order Midtrans dilanjutkan di halaman bayar milik Lakuna (Core
            // API) — path relatif, base = midtransOrderId tanpa sufiks
            // percobaan (-2, -3; lihat payment.charge.ts).
            const payBase = order.midtransOrderId?.replace(/-\d{1,2}$/, "") ?? null;
            const continuePaymentUrl =
                order.status === "PENDING" && token
                    ? isXenditUrl
                        ? token
                        : payBase
                            ? `/payment/pay/${encodeURIComponent(payBase)}`
                            : `${midtransBaseUrl}/${token}`
                    : null;
            return {
                ...order,
                continuePaymentUrl,
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
            };
        }),
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

    // Midtrans menolak gross_amount 0 (mis. diskon 100%).
    if (total <= 0) {
        throw new AppError(
            400,
            "FREE_ORDER_UNSUPPORTED",
            "Total pesanan setelah diskon Rp0 belum didukung pembayaran Midtrans",
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, username: true },
    });

    // Pentest tahap-2 fix: panggilan network Midtrans (ratusan ms) kini DI
    // LUAR transaksi DB. Sebelumnya snap.createTransaction dijalankan di
    // dalam prisma.$transaction sehingga lock baris voucher dipegang lama
    // → write-conflict P2034 → 500 mentah pada checkout konkuren. Sekarang
    // tiga fase dengan tx singkat: (A) order + klaim kuota voucher atomik,
    // (B) Midtrans Snap, (C) simpan token. P2034 di-retry via
    // withPrismaTxRetry; klaim kuota gagal → AppError 400 bersih.
    const created = await withPrismaTxRetry(() =>
        prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId: data.userId,
                    total,
                    discountAmount,
                    voucherId: discount.voucherId ?? null,
                    items: {
                        create: cart.map((item) => ({
                            photoId: item.photoId,
                            licenseType: item.license,
                            price: item.license === "SUBSCRIBE" ? 0 : item.photo.price,
                        })),
                    },
                },
                include: { items: true },
            });

            // Klaim kuota voucher atomik (total + per-user) — pengganti
            // cek read-then-write TOCTOU; menaikkan usedCount + redemption
            // row di tx yang sama dengan order.
            if (discount.source === "VOUCHER" && discount.voucherId && discountAmount > 0) {
                await claimVoucherQuota(tx, {
                    voucherId: discount.voucherId,
                    userId: data.userId,
                    amountCut: discountAmount,
                    orderId: order.id,
                });
            }

            return order;
        }),
    );

    // order_id Midtrans = ORDER-<uuid> (42 karakter, batas Midtrans 50). Dipakai
    // webhook (handleOrderWebhook) dan /api/payment/check untuk mencari order.
    const midtransOrderId = `ORDER-${created.id}`;

    // Midtrans mensyaratkan jumlah item_details == gross_amount, jadi diskon
    // ditulis sebagai baris negatif. id & nama item maksimal 50 karakter.
    const itemDetails: Array<{ id: string; name: string; price: number; quantity: number }> = pricedCart
        .filter((item) => item.checkoutPrice > 0)
        .map((item) => ({
            id: item.photo.id.slice(0, 50),
            name: (item.photo.title || "Foto").slice(0, 50),
            price: item.checkoutPrice,
            quantity: 1,
        }));
    if (discountAmount > 0) {
        itemDetails.push({
            id: "DISCOUNT",
            name: discount.source === "VOUCHER" && data.voucherCode
                ? `Voucher ${data.voucherCode}`.slice(0, 50)
                : "Diskon",
            price: -discountAmount,
            quantity: 1,
        });
    }

    // (B) Midtrans Snap — di luar transaksi DB.
    let transaction: any;
    try {
        transaction = await (snap as any).createTransaction({
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: total,
            },
            customer_details: {
                email: user?.email || data.email,
                first_name: user?.username,
            },
            item_details: itemDetails,
            // Midtrans menambahkan ?order_id=…&transaction_status=… ke URL ini;
            // frontend hanya memakai order_id lalu cek status ke backend.
            callbacks: {
                finish: `${process.env.FRONTEND_URL}/payment/finish`,
                unfinish: `${process.env.FRONTEND_URL}/payment/unfinish`,
                error: `${process.env.FRONTEND_URL}/payment/error`,
            },
        });
    } catch (err) {
        await compensateFailedSnap(created.id);
        throw err;
    }

    if (!transaction?.token || !transaction?.redirect_url) {
        await compensateFailedSnap(created.id);
        throw new AppError(502, "MIDTRANS_NO_TOKEN", "Midtrans tidak mengembalikan token pembayaran");
    }

    // (C) simpan token — tx singkat, di luar panggilan network.
    await withPrismaTxRetry(() =>
        prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: created.id },
                data: {
                    midtransOrderId,
                    midtransToken: transaction.token,
                },
            });
        }),
    );

    return {
        orderId: created.id,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        subtotal,
        discountAmount,
        discountSource: discount.source,
        total,
    };
}

// Kompensasi saat Midtrans gagal SETELAH order dibuat: batalkan order +
// kembalikan kuota voucher yang sudah diklaim (pentest tahap-2 fix #3).
async function compensateFailedSnap(orderId: string): Promise<void> {
    try {
        await prisma.$transaction(async (tx) => {
            await releaseVoucherQuota(tx, { orderId });
            await tx.order.updateMany({
                where: { id: orderId, status: "PENDING" },
                data: { status: "CANCELLED" },
            });
        });
    } catch (err) {
        // Jangan menelan kegagalan diam-diam — log untuk tindak lanjut manual.
        console.error("[ORDER_SNAP_COMPENSATE_FAILED]", { orderId, err });
    }
}

import { downloadPhotoService, getDownloadService } from "./download.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getAuthUser } from "../../utils/auth.js";
import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";
import { generateLicensePdf } from "../../utils/generateLicensePdf.js";
export async function getDownloadController(req, res, next) {
    try {
        const result = await getDownloadService(getAuthUser(req).userId, req.query);
        return res.json({
            success: true,
            data: result.licenses,
            meta: result.meta,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function downloadPhotoController(req, res, next) {
    try {
        const { photoId } = req.params;
        if (!photoId || Array.isArray(photoId)) {
            throw new AppError(400, "INVALID_PHOTO_ID", "Photo ID tidak valid");
        }
        const url = await downloadPhotoService({
            userId: getAuthUser(req).userId,
            photoId,
        });
        return res.json({
            success: true,
            data: {
                downloadUrl: url,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
export async function downloadLicensePdfController(req, res, next) {
    try {
        const { licenseId } = req.params;
        if (!licenseId || Array.isArray(licenseId)) {
            throw new AppError(400, "INVALID_LICENSE_ID", "License ID tidak valid");
        }
        const license = await prisma.license.findFirst({
            where: {
                id: licenseId,
                userId: getAuthUser(req).userId,
            },
            include: {
                photo: true,
                user: {
                    select: {
                        realName: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!license) {
            throw new AppError(404, "LICENSE_NOT_FOUND", "License tidak ditemukan");
        }
        // Generate or get existing PDF
        let licenseUrl = license.licenseKey;
        if (!licenseUrl) {
            const licenseKey = await generateLicensePdf({
                id: license.id,
                photoTitle: license.photo?.title || "Untitled",
                photographer: license.photo?.photographer || "Unknown",
                licenseType: license.type,
                createdAt: license.createdAt,
                expiresAt: license.expiresAt,
                orderId: license.orderId,
                issuedTo: license.user?.realName ||
                    license.user?.username ||
                    license.user?.email ||
                    "Lakuna User",
            });
            // Update license with PDF key
            await prisma.license.update({
                where: { id: license.id },
                data: { licenseKey: licenseKey },
            });
            licenseUrl = licenseKey;
        }
        // Get presigned URL
        const downloadUrl = await getPresignedUrl(licenseUrl);
        return res.json({
            success: true,
            data: {
                licenseId: license.id,
                photo: license.photo,
                type: license.type,
                downloadUrl,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=download.controller.js.map
import { getPhotoService, getPhotoByIdService, getPhotoByRelatedService, uploadPhotoService, updatePhotoService, deletePhotoService, addPhotoKeywordsService, removePhotoKeywordService, addPhotoCategoriesService, removePhotoCategoryService, } from "./photo.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getAuthUser } from "../../utils/auth.js";
export async function GetPhotoController(req, res, next) {
    try {
        const result = await getPhotoService(req.query);
        // Handle both old cache format (array) and new format ({ data, meta })
        const data = Array.isArray(result) ? result : result.data;
        const meta = Array.isArray(result) ? undefined : result.meta;
        return res.json({
            success: true,
            data,
            meta,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk GET /photos/:id
export async function GetPhotoByIdController(req, res, next) {
    try {
        const { id } = req.params;
        // Pastikan id adalah string
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        const photo = await getPhotoByIdService(id);
        // Jika foto tidak ditemukan
        if (!photo) {
            throw new AppError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan");
        }
        return res.json({
            success: true,
            data: photo,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk GET /photos/:id/related
export async function GetPhotoByRelatedController(req, res, next) {
    try {
        const { id } = req.params;
        // Pastikan id adalah string
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        const photo = await getPhotoByRelatedService(id);
        return res.json({
            success: true,
            photos: photo,
        });
    }
    catch (err) {
        next(err);
    }
}
// upload
export async function createPhotoController(req, res, next) {
    try {
        // Cek file
        if (!req.file) {
            throw new AppError(400, "PHOTO_REQUIRED", "Photo wajib diupload");
        }
        const userId = getAuthUser(req).userId;
        const normalizedBody = Object.fromEntries(Object.entries(req.body ?? {}).map(([key, value]) => [
            key.trim().toLowerCase(),
            value,
        ]));
        const resolvedPrice = normalizedBody.price ??
            normalizedBody.harga ??
            normalizedBody.amount ??
            normalizedBody["price[]"];
        if (resolvedPrice === undefined ||
            resolvedPrice === null ||
            resolvedPrice === "") {
            throw new AppError(400, "PRICE_REQUIRED", `Field price wajib diisi (key yang diterima: ${Object.keys(normalizedBody).join(", ") || "-"})`);
        }
        // Auto-detect type based on mimetype
        const isVideo = req.file.mimetype.startsWith("video/");
        const detectedType = isVideo ? "VIDEO" : "FOTO";
        // Use type from body if provided, otherwise use detected type
        const typeFromBody = normalizedBody.type;
        // Kirim data ke service
        const uploadPayload = {
            title: String(normalizedBody.title ?? ""),
            photographer: String(normalizedBody.photographer ?? ""),
            price: resolvedPrice,
            userId,
            file: req.file,
            type: typeFromBody || detectedType,
        };
        if (normalizedBody.description !== undefined) {
            uploadPayload.description = String(normalizedBody.description);
        }
        const photo = await uploadPhotoService(uploadPayload);
        return res.status(201).json({
            success: true,
            data: photo,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk PATCH /photos/:id
export async function updatePhotoController(req, res, next) {
    try {
        const { id } = req.params;
        // Validasi id
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        const normalizedBody = Object.fromEntries(Object.entries(req.body ?? {}).map(([key, value]) => [
            key.trim().toLowerCase(),
            value,
        ]));
        const resolvedPrice = normalizedBody.price ??
            normalizedBody.harga ??
            normalizedBody.amount ??
            normalizedBody["price[]"];
        if (Object.keys(normalizedBody).length === 0 && !req.file) {
            throw new AppError(400, "EMPTY_UPDATE", "Minimal satu field body atau file photo harus diisi");
        }
        const updatePayload = { id };
        if (normalizedBody.title !== undefined) {
            updatePayload.title = String(normalizedBody.title);
        }
        if (normalizedBody.description !== undefined) {
            updatePayload.description = String(normalizedBody.description);
        }
        if (normalizedBody.photographer !== undefined) {
            updatePayload.photographer = String(normalizedBody.photographer);
        }
        if (resolvedPrice !== undefined) {
            updatePayload.price = resolvedPrice;
        }
        if (req.file) {
            updatePayload.file = req.file;
        }
        const updatedPhoto = await updatePhotoService(updatePayload);
        return res.json({
            success: true,
            data: updatedPhoto,
            message: "Foto berhasil diupdate",
        });
    }
    catch (err) {
        next(err);
    }
}
// delete
export async function deletePhotoController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID ID", "ID photo tidak ditemukan");
        }
        await deletePhotoService({
            photoId: id,
            userId: getAuthUser(req).userId,
            role: getAuthUser(req).role,
        });
        return res.json({
            success: true,
            message: "Photo berhasil di hapus",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk POST /photos/:id/keywords - tambah keyword ke photo
export async function addPhotoKeywordController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        const { keywordIds } = req.body;
        const photoKeywords = await addPhotoKeywordsService(id, keywordIds);
        return res.json({
            success: true,
            data: photoKeywords,
            message: "Keyword berhasil ditambahkan ke foto",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk DELETE /photos/:id/keywords/:keywordId - hapus keyword dari photo
export async function removePhotoKeywordController(req, res, next) {
    try {
        const { id, keywordId } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        if (!keywordId || Array.isArray(keywordId)) {
            throw new AppError(400, "INVALID_KEYWORD_ID", "ID keyword tidak valid");
        }
        await removePhotoKeywordService(id, keywordId);
        return res.json({
            success: true,
            message: "Keyword berhasil dihapus dari foto",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk POST /photos/:id/categories - tambah category ke photo
export async function addPhotoCategoryController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        const { categoryIds } = req.body;
        const photoCategories = await addPhotoCategoriesService(id, categoryIds);
        return res.json({
            success: true,
            data: photoCategories,
            message: "Category berhasil ditambahkan ke foto",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk DELETE /photos/:id/categories/:categoryId - hapus category dari photo
export async function removePhotoCategoryController(req, res, next) {
    try {
        const { id, categoryId } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
        }
        if (!categoryId || Array.isArray(categoryId)) {
            throw new AppError(400, "INVALID_CATEGORY_ID", "ID category tidak valid");
        }
        await removePhotoCategoryService(id, categoryId);
        return res.json({
            success: true,
            message: "Category berhasil dihapus dari foto",
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=photo.controller.js.map
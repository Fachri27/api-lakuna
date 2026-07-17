import { getKeywordsService, getKeywordByIdService, createKeywordService, updateKeywordService, deleteKeywordService, } from "./keyword.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
// Controller untuk GET /keywords
export async function GetKeywordsController(req, res, next) {
    try {
        const result = await getKeywordsService(req.query);
        return res.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk GET /keywords/:id
export async function GetKeywordByIdController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID keyword tidak valid");
        }
        const keyword = await getKeywordByIdService(id);
        return res.json({
            success: true,
            data: keyword,
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk POST /keywords
export async function CreateKeywordController(req, res, next) {
    try {
        const keyword = await createKeywordService(req.body);
        return res.status(201).json({
            success: true,
            data: keyword,
            message: "Keyword berhasil dibuat",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk PATCH /keywords/:id
export async function UpdateKeywordController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID keyword tidak valid");
        }
        const keyword = await updateKeywordService(id, req.body);
        return res.json({
            success: true,
            data: keyword,
            message: "Keyword berhasil diupdate",
        });
    }
    catch (err) {
        next(err);
    }
}
// Controller untuk DELETE /keywords/:id
export async function DeleteKeywordController(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError(400, "INVALID_ID", "ID keyword tidak valid");
        }
        await deleteKeywordService(id);
        return res.json({
            success: true,
            message: "Keyword berhasil dihapus",
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=keyword.controller.js.map
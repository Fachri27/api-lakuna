import { deleteMeService, getMeService, updateAvatarMeService, updateUserService, getAllUsersService, updateUserRoleService } from "./user.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
// Admin: Get all users
export async function getAllUsersController(req, res, next) {
    try {
        const result = await getAllUsersService(req.query);
        return res.json({
            success: true,
            data: result.users,
            meta: result.meta,
        });
    }
    catch (err) {
        next(err);
    }
}
// Admin: Update user role
export async function updateUserRoleController(req, res, next) {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        if (!role || !["USER", "ADMIN"].includes(role)) {
            throw new AppError(400, "INVALID_ROLE", "Role harus USER atau ADMIN");
        }
        const user = await updateUserRoleService(userId, role);
        return res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function updaterUserController(req, res, next) {
    try {
        const user = await updateUserService({
            userId: req.user.userId,
            username: req.body.username,
            realName: req.body.realName,
            newsletter: req.body.newsletter,
        });
        return res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function getMeController(req, res, next) {
    try {
        const user = await getMeService(req.user.userId);
        return res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
}
// avatar
export async function updateAvatarController(req, res, next) {
    try {
        if (!req.file) {
            throw new AppError(404, "FILE_NOT_FOUND", "File tidak di temukan");
        }
        const user = await updateAvatarMeService({
            userId: req.user.userId,
            file: req.file,
        });
        return res.json({
            success: true,
            data: user
        });
    }
    catch (err) {
        next(err);
    }
}
// delete
export async function deleteMeController(req, res, next) {
    try {
        const header = req.headers.authorization;
        const accessToken = header?.split(" ")[1];
        await deleteMeService({
            userId: req.user.userId,
            ...(accessToken && { accessToken }),
        });
        res.json({
            success: true,
            message: "Berhasil di hapus"
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=user.controller.js.map
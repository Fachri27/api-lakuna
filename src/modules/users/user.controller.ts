import { NextFunction, Request, Response } from "express";
import { deleteMeService, getMeService, updateAvatarMeService, updateUserService, getAllUsersService, updateUserRoleService } from "./user.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { AuthenticatedUser } from "../../types/express.js";

// Admin: Get all users
export async function getAllUsersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getAllUsersService(req.query as { page?: string; limit?: string });

    return res.json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// Admin: Update user role
export async function updateUserRoleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;

    if (!role || !["USER", "ADMIN", "CONTRIBUTOR"].includes(role)) {
      throw new AppError(400, "INVALID_ROLE", "Role harus USER, ADMIN, atau CONTRIBUTOR");
    }

    const user = await updateUserRoleService(userId, role as "USER" | "ADMIN" | "CONTRIBUTOR");

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function updaterUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await updateUserService({
      userId: (req.user as AuthenticatedUser).userId,
      username: req.body.username,
      realName: req.body.realName,
      newsletter: req.body.newsletter,
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMeController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {

        const refresh = req.query.refresh === 'true';
        const user = await getMeService((req.user as AuthenticatedUser).userId, refresh);

        return res.json({
            success: true,
            data: user,
        });

    } catch(err) {
        next(err);
    }
}

// avatar
export async function updateAvatarController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        if(!req.file) {
            throw new AppError(
                404,
                "FILE_NOT_FOUND",
                "File tidak di temukan",
            );
        }

        const user = await updateAvatarMeService({
            userId: (req.user as AuthenticatedUser).userId,
            file: req.file,
        });

        return res.json({
            success: true,
            data: user
        });

    } catch(err) {
        next(err);
    }
}

// delete
export async function deleteMeController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const header = req.headers.authorization;
        const accessToken = header?.split(" ")[1];

        await deleteMeService({
            userId: (req.user as AuthenticatedUser).userId,
            ...(accessToken && { accessToken }),
        });

        res.json({
            success: true,
            message: "Berhasil di hapus"
        });

    } catch(err) {
        next(err);
    }
}

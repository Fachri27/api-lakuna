import { NextFunction, Request, Response } from "express";
import {
  getPhotoService,
  getPhotoByIdService,
  getPhotoByRelatedService,
  uploadPhotoService,
  updatePhotoService,
  deletePhotoService,
  addPhotoKeywordsService,
  removePhotoKeywordService,
  addPhotoCategoriesService,
  removePhotoCategoryService,
} from "./photo.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getAuthUser } from "../../utils/auth.js";
import { prisma } from "../../config/db.js";

export async function GetPhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getPhotoService(req.query as any);

    // Handle both old cache format (array) and new format ({ data, meta })
    const data = Array.isArray(result) ? result : result.data;
    const meta = Array.isArray(result) ? undefined : result.meta;

    return res.json({
      success: true,
      data,
      meta,
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk GET /photos/:id
export async function GetPhotoByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// Controller untuk GET /photos/:id/related
export async function GetPhotoByRelatedController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// upload
export async function createPhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Cek file
    const files = req.files as
      | { photo?: Express.Multer.File[]; watermark?: Express.Multer.File[] }
      | undefined;
    const photoFile = files?.photo?.[0];
    const watermarkFile = files?.watermark?.[0];

    if (!photoFile) {
      throw new AppError(400, "PHOTO_REQUIRED", "Photo wajib diupload");
    }

    const userId = getAuthUser(req).userId;

    const normalizedBody = Object.fromEntries(
      Object.entries(req.body ?? {}).map(([key, value]) => [
        key.trim().toLowerCase(),
        value,
      ]),
    ) as Record<string, unknown>;
    const resolvedPrice =
      normalizedBody.price ??
      normalizedBody.harga ??
      normalizedBody.amount ??
      normalizedBody["price[]"];

    if (
      resolvedPrice === undefined ||
      resolvedPrice === null ||
      resolvedPrice === ""
    ) {
      throw new AppError(
        400,
        "PRICE_REQUIRED",
        `Field price wajib diisi (key yang diterima: ${
          Object.keys(normalizedBody).join(", ") || "-"
        })`,
      );
    }

    // Auto-detect type based on mimetype
    const isVideo = photoFile.mimetype.startsWith("video/");
    const detectedType = isVideo ? "VIDEO" : "FOTO";

    // Use type from body if provided, otherwise use detected type
    const typeFromBody = normalizedBody.type as "FOTO" | "VIDEO";

    // Kirim data ke service
    const user = getAuthUser(req);

    const uploadPayload: {
      title: string;
      photographer: string;
      price: string | number;
      userId: string;
      role: string;
      file: Express.Multer.File;
      watermark?: Express.Multer.File;
      description?: string;
      type: "FOTO" | "VIDEO";
    } = {
      title: String(normalizedBody.title ?? ""),
      photographer: String(normalizedBody.photographer ?? ""),
      price: resolvedPrice as string | number,
      userId,
      role: user.role,
      file: photoFile,
      type: typeFromBody || detectedType,
    };

    if (watermarkFile) {
      uploadPayload.watermark = watermarkFile;
    }

    if (normalizedBody.description !== undefined) {
      uploadPayload.description = String(normalizedBody.description);
    }

    const photo = await uploadPhotoService(uploadPayload);

    return res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk PATCH /photos/:id
export async function updatePhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    // Validasi id
    if (!id || Array.isArray(id)) {
      throw new AppError(400, "INVALID_ID", "ID foto tidak valid");
    }

    const normalizedBody = Object.fromEntries(
      Object.entries(req.body ?? {}).map(([key, value]) => [
        key.trim().toLowerCase(),
        value,
      ]),
    ) as Record<string, unknown>;

    const resolvedPrice =
      normalizedBody.price ??
      normalizedBody.harga ??
      normalizedBody.amount ??
      normalizedBody["price[]"];

    const files = req.files as
      | { photo?: Express.Multer.File[]; watermark?: Express.Multer.File[] }
      | undefined;
    const photoFile = files?.photo?.[0];
    const watermarkFile = files?.watermark?.[0];

    if (Object.keys(normalizedBody).length === 0 && !photoFile && !watermarkFile) {
      throw new AppError(
        400,
        "EMPTY_UPDATE",
        "Minimal satu field body atau file photo/watermark harus diisi",
      );
    }

    const updatePayload: {
      id: string;
      title?: string;
      description?: string;
      photographer?: string;
      price?: string | number;
      file?: Express.Multer.File;
      watermark?: Express.Multer.File;
    } = { id };

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
      updatePayload.price = resolvedPrice as string | number;
    }
    if (photoFile) {
      updatePayload.file = photoFile;
    }
    if (watermarkFile) {
      updatePayload.watermark = watermarkFile;
    }

    const updatedPhoto = await updatePhotoService(updatePayload);

    return res.json({
      success: true,
      data: updatedPhoto,
      message: "Foto berhasil diupdate",
    });
  } catch (err) {
    next(err);
  }
}

// delete
export async function approvePhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const photo = await prisma.photo.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    return res.json({ success: true, data: photo, message: "Foto disetujui" });
  } catch (err) {
    next(err);
  }
}

export async function rejectPhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const photo = await prisma.photo.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return res.json({ success: true, data: photo, message: "Foto ditolak" });
  } catch (err) {
    next(err);
  }
}

export async function getPendingPhotosController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const photos = await prisma.photo.findMany({
      where: { status: "PENDING", deletedAt: null },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: photos });
  } catch (err) {
    next(err);
  }
}

export async function getMyPhotosController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthUser(req).userId;
    const photos = await prisma.photo.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: photos });
  } catch (err) {
    next(err);
  }
}

export async function deletePhotoController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// Controller untuk POST /photos/:id/keywords - tambah keyword ke photo
export async function addPhotoKeywordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// Controller untuk DELETE /photos/:id/keywords/:keywordId - hapus keyword dari photo
export async function removePhotoKeywordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// Controller untuk POST /photos/:id/categories - tambah category ke photo
export async function addPhotoCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

// Controller untuk DELETE /photos/:id/categories/:categoryId - hapus category dari photo
export async function removePhotoCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  } catch (err) {
    next(err);
  }
}

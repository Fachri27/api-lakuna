import { NextFunction, Request, Response } from "express";
import {
  getPhotoService,
  getPhotoByIdService,
  getPhotoByRelatedService,
  getPhotoLocationsService,
  uploadPhotoService,
  updatePhotoService,
  deletePhotoService,
  addPhotoKeywordsService,
  removePhotoKeywordService,
  addPhotoCategoriesService,
  removePhotoCategoryService,
  mapPhotoRow,
} from "./photo.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { getAuthUser } from "../../utils/auth.js";
import { getPagination } from "../../utils/paginate.js";
import { prisma } from "../../config/db.js";
import { getPresignedUrl } from "../../config/minio.js";

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

    // req.body sudah lewat validate(UploadPhotoSchema): pakai hasil validasi
    // (title/photographer/price/description/location/type sudah dalam batas
    // max schema). Tidak ada lagi parsing manual String()/resolvedPrice.
    const { title, photographer, price, description, location, type, batchId } =
      req.body as {
        title: string;
        photographer: string;
        price: number;
        description?: string;
        location?: string;
        type?: "FOTO" | "VIDEO";
        batchId?: string;
      };

    if (price === undefined || price === null || Number.isNaN(price)) {
      throw new AppError(400, "PRICE_REQUIRED", "Field price wajib diisi");
    }

    // Auto-detect type based on mimetype
    const isVideo = photoFile.mimetype.startsWith("video/");
    const detectedType = isVideo ? "VIDEO" : "FOTO";

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
      location?: string;
      batchId?: string;
      type: "FOTO" | "VIDEO";
    } = {
      title,
      photographer,
      price,
      userId,
      role: user.role,
      file: photoFile,
      type: type ?? detectedType,
    };

    if (watermarkFile) {
      uploadPayload.watermark = watermarkFile;
    }

    if (description !== undefined) {
      uploadPayload.description = description;
    }

    if (location !== undefined) {
      uploadPayload.location = location;
    }

    if (batchId) {
      uploadPayload.batchId = batchId;
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

    const { title, description, location, photographer, price, type } = req.body as {
      title?: string;
      description?: string;
      location?: string;
      photographer?: string;
      price?: number;
      type?: "FOTO" | "VIDEO";
    };

    const files = req.files as
      | { photo?: Express.Multer.File[]; watermark?: Express.Multer.File[] }
      | undefined;
    const photoFile = files?.photo?.[0];
    const watermarkFile = files?.watermark?.[0];

    if (
      title === undefined &&
      description === undefined &&
      location === undefined &&
      photographer === undefined &&
      price === undefined &&
      type === undefined &&
      !photoFile &&
      !watermarkFile
    ) {
      throw new AppError(
        400,
        "EMPTY_UPDATE",
        "Minimal satu field body atau file photo/watermark harus diisi",
      );
    }

    const updatePayload: {
      id: string;
      title?: string;
      description?: string | null;
      location?: string | null;
      photographer?: string;
      price?: string | number;
      type?: "FOTO" | "VIDEO";
      file?: Express.Multer.File;
      watermark?: Express.Multer.File;
    } = { id };

    if (title !== undefined) {
      updatePayload.title = title;
    }
    // String kosong = sengaja dikosongkan dari form → simpan sebagai null.
    if (description !== undefined) {
      updatePayload.description = description.trim() || null;
    }
    if (location !== undefined) {
      updatePayload.location = location.trim() || null;
    }
    if (photographer !== undefined) {
      updatePayload.photographer = photographer;
    }
    if (price !== undefined) {
      updatePayload.price = price;
    }
    if (type !== undefined) {
      updatePayload.type = type;
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
      data: { status: "APPROVED", rejectNote: null },
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
    // Catatan alasan (opsional, ≤500) — ditampilkan ke kontributor.
    const rawNote = typeof req.body?.note === "string" ? req.body.note.trim() : "";
    const note = rawNote ? rawNote.slice(0, 500) : null;
    const photo = await prisma.photo.update({
      where: { id },
      data: { status: "REJECTED", rejectNote: note },
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
    const pagination = getPagination(req.query as { page?: string; limit?: string });
    const page = Number.isFinite(pagination.page) ? pagination.page : 1;
    const limit = Number.isFinite(pagination.limit) ? pagination.limit : 20;
    const skip = (page - 1) * limit;
    const where = { status: "PENDING" as const, deletedAt: null };
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);
    return res.json({
      success: true,
      // Petakan seperti list publik (thumbUrl/watermarkUrl), lalu tambahkan
      // originalUrl: kurator perlu menilai file asli resolusi penuh. Aman
      // karena rute ini khusus ADMIN; respons publik tetap tanpa originalUrl.
      data: await Promise.all(
        photos.map(async (p) => ({
          ...(await mapPhotoRow(p)),
          originalUrl: p.originalKey ? await getPresignedUrl(p.originalKey).catch(() => null) : null,
        })),
      ),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// Controller untuk GET /photos/locations — daftar lokasi unik
// (datalist form unggah). Publik, tanpa auth.
export async function getPhotoLocationsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Number(req.query.limit);
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await getPhotoLocationsService(
      Number.isFinite(limit) ? limit : undefined,
      q,
    );
    return res.json({ success: true, data });
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
    const pagination = getPagination(req.query as { page?: string; limit?: string });
    const page = Number.isFinite(pagination.page) ? pagination.page : 1;
    const limit = Number.isFinite(pagination.limit) ? pagination.limit : 20;
    const skip = (page - 1) * limit;
    const where = { userId, deletedAt: null };
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);
    return res.json({
      success: true,
      // thumbUrl/watermarkUrl presigned seperti list publik (tanpa file asli).
      // Dulu baris mentah dikirim: tak ada thumbUrl, frontend jatuh ke
      // gambar acak picsum.
      data: await Promise.all(photos.map((p) => mapPhotoRow(p))),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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

    const me = getAuthUser(req) as { userId: string; role?: string };
    const photoKeywords = await addPhotoKeywordsService(
      id,
      keywordIds,
      me.role === "ADMIN" ? undefined : me.userId,
    );

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

    const me = getAuthUser(req) as { userId: string; role?: string };
    const photoCategories = await addPhotoCategoriesService(
      id,
      categoryIds,
      me.role === "ADMIN" ? undefined : me.userId,
    );

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

/**
 * GET /api/photos/:id/view — URL presigned file ASLI (tanpa watermark) untuk
 * viewer layar penuh (foto) dan pemutar halaman detail (video). Hanya yang
 * sudah APPROVED; berlaku 10 menit.
 * Diminta satu per satu saat viewer dibuka, bukan ikut di respons daftar.
 */
export async function getPhotoViewController(req: Request, res: Response, next: NextFunction) {
  try {
    const photo = await prisma.photo.findFirst({
      where: { id: String(req.params.id), status: "APPROVED", deletedAt: null },
      select: { originalKey: true },
    });
    if (!photo?.originalKey) throw new AppError(404, "NOT_FOUND", "Foto tidak ditemukan");
    const url = await getPresignedUrl(photo.originalKey, 600);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}

import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { uploadFileBuffer, cleanUploadFile } from "../../middlewares/upload.js";
import { PDFDocument } from "pdf-lib";
import { prisma } from "../../config/db.js";
import {
  DEFAULT_OVERLAY_LAYOUT,
  OVERLAY_FIELDS,
  renderOverlayTemplate,
  photoAspect,
} from "../../utils/licenseOverlay.js";
import { loadLicensePhoto } from "../../utils/licensePhoto.js";
import {
  LICENSE_TEMPLATE_FIELDS,
  TEMPLATE_MAX_BYTES,
  TEMPLATE_MAX_FILES,
  mergeTemplatePdfs,
  saveOverlayLayout,
  sampleOverlayData,
  getLicenseTemplate,
  fetchTemplateBytes,
  inspectTemplatePdf,
  fillLicenseTemplate,
  saveLicenseTemplate,
  sampleLicenseData,
} from "../../utils/licenseTemplate.js";
import { Router } from "express";

/** Upload khusus template: PDF saja, maks 25 MB per berkas, di memori. */
const templateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TEMPLATE_MAX_BYTES, files: TEMPLATE_MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf" && !file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "File harus PDF"));
      return;
    }
    cb(null, true);
  },
});

async function getTemplateController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const template = await getLicenseTemplate();
    if (!template) {
      return res.status(200).json({
        success: true,
        data: { configured: false, version: 0, fields: [], knownFields: [], missingFields: [...LICENSE_TEMPLATE_FIELDS] },
      });
    }
    const bytes = await fetchTemplateBytes(template.objectKey);
    const inspected = await inspectTemplatePdf(bytes);
    const pageCount = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
    return res.status(200).json({
      success: true,
      data: {
        configured: true,
        objectKey: template.objectKey,
        version: template.version,
        mode: template.mode,
        pageCount,
        layout: template.layout,
        customLayout: template.customLayout,
        overlayFields: OVERLAY_FIELDS,
        fieldNames: inspected.fieldNames,
        knownFields: inspected.knownFields,
        missingFields: inspected.missingFields,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function uploadTemplateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const files = ((req as Request & { files?: Express.Multer.File[] }).files ?? []).filter(
      (f) => (f.buffer?.length ?? 0) > 0 || !!f.path,
    );
    if (!files.length) {
      throw new AppError(400, "NO_FILE", "Unggah berkas PDF template dulu");
    }
    // Beberapa berkas (Hal 1, Hal 2, …) digabung sesuai urutan unggah.
    const merged = await mergeTemplatePdfs(files.map((f) => uploadFileBuffer(f)));
    files.forEach(cleanUploadFile);
    const result = await saveLicenseTemplate(merged);
    const template = await getLicenseTemplate();
    return res.status(201).json({
      success: true,
      data: {
        configured: true,
        version: result.version,
        mode: result.mode,
        pageCount: result.pageCount,
        layout: template?.layout ?? DEFAULT_OVERLAY_LAYOUT,
        customLayout: template?.customLayout ?? false,
        overlayFields: OVERLAY_FIELDS,
        fieldNames: result.fieldNames,
        knownFields: result.knownFields,
        missingFields: result.missingFields,
        note: "PDF lisensi lama dihapus — akan dibuat ulang dari template baru saat berikutnya diunduh.",
      },
    });
  } catch (err) {
    if (err instanceof Error && !((err as { statusCode?: number }).statusCode)) {
      return next(new AppError(400, "INVALID_TEMPLATE", err.message));
    }
    next(err);
  }
}

/** Preview: template terpasang diisi data contoh → PDF langsung (bukan presigned). */
async function previewTemplateController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const template = await getLicenseTemplate();
    if (!template) {
      throw new AppError(404, "NO_TEMPLATE", "Belum ada template custom — unggah dulu");
    }
    const bytes = await fetchTemplateBytes(template.objectKey);
    let pdf: Buffer;
    if (template.mode === "overlay") {
      // Foto contoh = foto terbaru yang sudah disetujui.
      const sample = await prisma.photo.findFirst({
        where: { status: "APPROVED", deletedAt: null, type: "FOTO" },
        orderBy: { createdAt: "desc" },
        select: { originalKey: true },
      });
      const aspect = photoAspect(template.layout);
      const photo = aspect && sample?.originalKey
        ? await loadLicensePhoto(sample.originalKey, false, aspect).catch(() => null)
        : null;
      pdf = await renderOverlayTemplate(bytes, template.layout, sampleOverlayData(), photo);
    } else {
      pdf = await fillLicenseTemplate(bytes, sampleLicenseData());
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="preview-lisensi.pdf"');
    return res.status(200).send(Buffer.from(pdf));
  } catch (err) {
    next(err);
  }
}

const routerLicenseTemplate = Router();

// Semua endpoint khusus ADMIN.
routerLicenseTemplate.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTemplateController,
);
routerLicenseTemplate.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req: Request, res: Response, next: NextFunction) =>
    templateUpload.array("template", TEMPLATE_MAX_FILES)(req, res, (err?: unknown) => {
      const code = (err as { code?: string } | undefined)?.code;
      if (code === "LIMIT_FILE_SIZE") {
        return next(new AppError(413, "FILE_TOO_LARGE", `Tiap berkas template maks ${TEMPLATE_MAX_BYTES / 1024 / 1024} MB`));
      }
      if (code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError(400, "TOO_MANY_FILES", `Maks ${TEMPLATE_MAX_FILES} berkas per unggahan`));
      }
      next(err as Error | undefined);
    }),
  uploadTemplateController,
);
/** Simpan tata letak overlay (body: { layout } ; layout null = bawaan). */
routerLicenseTemplate.put(
  "/layout",
  authMiddleware,
  roleMiddleware("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = (req.body ?? {}).layout;
      const layout = await saveOverlayLayout(raw === null ? null : raw);
      return res.json({ success: true, data: { layout, customLayout: raw !== null } });
    } catch (err) {
      if (err instanceof Error && !(err as { statusCode?: number }).statusCode) {
        return next(new AppError(400, "INVALID_LAYOUT", err.message));
      }
      next(err);
    }
  },
);
routerLicenseTemplate.post(
  "/preview",
  authMiddleware,
  roleMiddleware("ADMIN"),
  previewTemplateController,
);

export default routerLicenseTemplate;

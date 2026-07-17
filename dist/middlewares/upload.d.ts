import multer from "multer";
/**
 * Multer config for image and video uploads
 * - 100MB max file size (for videos)
 * - Images (mimetype starts with "image/") and Videos (mimetype starts with "video/")
 * - Memory storage for processing with Sharp (images) or direct upload (videos)
 */
export declare const upload: multer.Multer;
//# sourceMappingURL=upload.d.ts.map
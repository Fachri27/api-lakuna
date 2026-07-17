import multer from "multer";
/**
 * Multer config for image and video uploads
 * - 100MB max file size (for videos)
 * - Images (mimetype starts with "image/") and Videos (mimetype starts with "video/")
 * - Memory storage for processing with Sharp (images) or direct upload (videos)
 */
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB for videos
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/", "video/"];
        if (allowedMimeTypes.some((type) => file.mimetype.startsWith(type))) {
            cb(null, true);
        }
        else {
            cb(new Error("File harus gambar atau video"));
        }
    },
});
//# sourceMappingURL=upload.js.map
export class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
    }
}
export function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }
    // prisma error handler
    if (err.constructor.name === "PrismaClientKnownRequestError") {
        const prismaErr = err;
        if (prismaErr.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Data sudah ada",
                },
            });
        }
    }
    // multer / upload validation error
    if (err.name === "MulterError") {
        const multerErr = err;
        const isUnexpectedField = multerErr.code === "LIMIT_UNEXPECTED_FILE";
        return res.status(400).json({
            success: false,
            error: {
                code: "UPLOAD_ERROR",
                message: isUnexpectedField
                    ? `Field upload tidak sesuai: "${multerErr.field}".`
                    : err.message,
            },
        });
    }
    // Log the real error server-side, return generic message to client
    console.error("[INTERNAL_ERROR]", err);
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan pada server",
        },
    });
}
//# sourceMappingURL=errorHandler.js.map
export function sendResponse(res, data, statusCode) {
    return res.status(statusCode).json({
        success: true,
        data,
    });
}
export function sendPaginated(res, data, meta) {
    return res.status(200).json({
        success: true,
        data,
        meta: {
            ...meta,
            totalPages: Math.ceil(meta.total / meta.limit),
        },
    });
}
//# sourceMappingURL=response.js.map
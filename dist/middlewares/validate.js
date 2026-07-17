export function validate(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse({
                body: req.body || {}, // Handle undefined body
                query: req.query,
                params: req.params,
            });
            if (!result.success) {
                const errors = result.error.issues.map((e) => ({
                    field: e.path.slice(1).join("."),
                    message: e.message,
                }));
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Input tidak valid",
                        details: errors,
                    },
                });
            }
            const data = result.data;
            req.body = data.body ?? req.body;
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map
import swaggerJsdoc from "swagger-jsdoc";
export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Lakuna Foto API",
            version: "1.0.0",
            description: "API for Lakuna Foto stock photo website",
        },
        servers: [
            {
                url: process.env.API_URL || "http://localhost:3000",
                description: process.env.NODE_ENV === "production" ? "Production server" : "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string", enum: ["USER", "ADMIN"] },
                    },
                },
                Photo: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        photographer: { type: "string" },
                        price: { type: "number" },
                        type: { type: "string", enum: ["FOTO", "VIDEO"] },
                    },
                },
                Subscription: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        plan: { type: "string" },
                        quota: { type: "number" },
                        used: { type: "number" },
                        status: { type: "string", enum: ["ACTIVE", "EXPIRED", "CANCELLED"] },
                        expiresAt: { type: "string", format: "date-time" },
                    },
                },
                Plan: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        quota: { type: "number" },
                        priceMonthly: { type: "number" },
                        priceAnnual: { type: "number" },
                        isActive: { type: "boolean" },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./src/modules/**/*.ts"],
});
//# sourceMappingURL=swagger.js.map
// db.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});
prisma
    .$connect()
    .then(() => {
    if (process.env.NODE_ENV !== 'test') {
        console.log("✓ Connected to Database");
    }
})
    .catch((err) => {
    console.error("✗ Database connection error:", err);
    process.exit(1);
});
//# sourceMappingURL=db.js.map
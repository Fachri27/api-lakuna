import { Prisma } from "@prisma/client";

/**
 * Retry untuk transaksi interaktif Prisma yang kena P2034
 * (write conflict / deadlock). Prisma sendiri merekomendasikan retry;
 * sebelumnya error ini bocor sebagai 500 INTERNAL_SERVER_ERROR mentah
 * ke klien saat checkout voucher konkuren.
 *
 * Hanya P2034 yang di-retry — error lain diteruskan apa adanya.
 * Fn harus idempoten terhadap rollback: transaksi yang gagal
 * ter-rollback penuh, jadi retry aman.
 */
export async function withPrismaTxRetry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        attempt < MAX_ATTEMPTS
      ) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 40 * 2 ** (attempt - 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

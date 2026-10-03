// Membuat (atau menyelaraskan) SATU akun admin CMS — aman untuk produksi.
//
// Tidak ada password di kode: email & password dibaca dari variabel saat
// dijalankan, dan password tidak pernah dicetak.
//
//   ADMIN_EMAIL="kamu@email.com" ADMIN_PASSWORD="password-kuat-minimal-12" \
//   DATABASE_URL="<url database>" \
//   node --import tsx/esm prisma/seeds/seed-admin.ts --yes
//
// Opsional: ADMIN_USERNAME (default dari bagian depan email), ADMIN_NAME.
// Idempoten:
// - Akun belum ada  → dibuat (role ADMIN).
// - Akun sudah ada  → role dijadikan ADMIN & akun dipulihkan bila ter-soft-delete;
//   password TIDAK diubah, kecuali dijalankan dengan --reset-password.
// Target database jarak jauh wajib --yes (lihat _guard.ts).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertSafeTarget } from "./_guard.js";

const prisma = new PrismaClient();

const MIN_LEN = 12;
const WEAK = new Set([
  "admin123", "admin1234", "password", "password123", "123456789012", "qwertyuiop12",
  "contributor123", "lakuna123", "lakunafoto123",
]);

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} wajib diisi`);
  return v;
}

function validate(email: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL bukan email yang valid");
  if (password.length < MIN_LEN) throw new Error(`ADMIN_PASSWORD minimal ${MIN_LEN} karakter`);
  if (WEAK.has(password.toLowerCase())) throw new Error("ADMIN_PASSWORD terlalu umum — pilih yang lain");
  if (password.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 4) {
    throw new Error("ADMIN_PASSWORD tidak boleh memuat nama email");
  }
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    throw new Error("ADMIN_PASSWORD harus memuat huruf dan angka");
  }
}

async function main() {
  assertSafeTarget();

  const email = need("ADMIN_EMAIL").toLowerCase();
  const password = need("ADMIN_PASSWORD");
  validate(email, password);

  const username = (process.env.ADMIN_USERNAME?.trim() || email.split("@")[0]).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!username) throw new Error("ADMIN_USERNAME tidak valid");
  const realName = process.env.ADMIN_NAME?.trim() || "Administrator";
  const reset = process.argv.includes("--reset-password");

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        deletedAt: null,
        ...(reset ? { password: bcrypt.hashSync(password, 12) } : {}),
      },
    });
    console.log(`✓ Diperbarui: ${email} → ADMIN${reset ? " (password direset)" : " (password tidak diubah)"}`);
    return;
  }

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) throw new Error(`Username "${username}" sudah dipakai akun lain — isi ADMIN_USERNAME yang berbeda`);

  await prisma.user.create({
    data: { username, email, password: bcrypt.hashSync(password, 12), realName, role: "ADMIN" },
  });
  console.log(`✓ Dibuat: ${email} → ADMIN (username: ${username})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed admin gagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

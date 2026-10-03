/**
 * Pengaman untuk seeder: mencegah menjalankan seeder ke database JARAK JAUH
 * (mis. produksi Railway) tanpa sengaja. Alamat dicetak TANPA kredensial.
 *
 * - Host lokal (localhost / 127.0.0.1 / ::1): lanjut tanpa syarat.
 * - Host lain: wajib argumen `--yes`, supaya salah menempel DATABASE_URL tidak
 *   langsung menulis data ke produksi.
 */
export function assertSafeTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum diset");

  let host = "";
  let target = "";
  try {
    const u = new URL(raw);
    host = u.hostname;
    target = `${u.hostname}:${u.port || "3306"}${u.pathname}`;
  } catch {
    throw new Error("DATABASE_URL bukan URL yang valid");
  }

  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  console.log(`🎯 Database target: ${target} (${local ? "lokal" : "JARAK JAUH"})`);

  if (!local && !process.argv.includes("--yes")) {
    throw new Error(
      `Target ${target} bukan database lokal. Jalankan lagi dengan --yes bila memang disengaja.`,
    );
  }
}

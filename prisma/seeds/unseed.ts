// Menghapus HASIL SEED (foto contoh, dan opsional akun & file storage) — aman:
//
// - Default DRY-RUN: hanya menampilkan apa yang AKAN dihapus. Hapus sungguhan
//   hanya dengan --apply.
// - Hanya menyentuh foto yang JUDULNYA cocok dengan daftar seeder (seed-media,
//   seed-photos, awalan "[Dummy] "). Foto lain tidak disentuh.
// - Foto yang sudah punya pesanan / unduhan / lisensi / pendapatan DILEWATI
//   (dilaporkan), supaya riwayat transaksi tak rusak.
// - Foto yang sudah DIEDIT sesudah dibuat (updatedAt jauh sesudah createdAt —
//   mis. file aslinya diganti lewat CMS tapi judul "[Dummy] …" tetap) DILEWATI,
//   agar media asli tak ikut terhapus. Paksa hapus dengan --include-edited.
//   Atau lindungi per judul: --keep="Judul A|Judul B".
// - Target DB selain localhost wajib --yes (lihat _guard.ts).
//
//   DATABASE_URL="<url>" node --import tsx/esm prisma/seeds/unseed.ts --yes            # dry-run
//   DATABASE_URL="<url>" node --import tsx/esm prisma/seeds/unseed.ts --yes --apply    # hapus foto
//
// Opsi tambahan (dengan --apply):
//   --files     hapus juga file di storage (butuh MINIO_* di environment)
//   --accounts  hapus akun bawaan seeder (admin@/contributor1-3@/user1-3@lakuna.foto)
//               HANYA yang tak punya data lain. Jangan dipakai bila admin@lakuna.foto
//               masih kamu pakai login.
import { PrismaClient } from "@prisma/client";
import { assertSafeTarget } from "./_guard.js";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FILES = process.argv.includes("--files");
const ACCOUNTS = process.argv.includes("--accounts");
const INCLUDE_EDITED = process.argv.includes("--include-edited");
const KEEP_TITLES = new Set(
  (process.argv.find((a) => a.startsWith("--keep="))?.slice("--keep=".length) ?? "")
    .split("|").map((t) => t.trim()).filter(Boolean),
);
// Selisih updatedAt-createdAt di atas ini dianggap "sudah diedit".
const EDITED_AFTER_MS = 60_000;

const SEED_TITLES = [
  // seed-media
  "Fajar di Danau Toba", "Senja di Pantai Kuta", "Kabut Hutan Kerinci", "Candi Prambanan Biru",
  "Air Terjun Tumpak Sewu", "Pasar Pagi Pasar Beringharjo", "Ombak Pantai Selatan",
  "Timelapse Awan Bromo", "Lalu Lintas Malam Jakarta", "Rumah Adat Wae Rebo",
  "Terumbu Karang Wakatobi", "Festival Lampion Borobudur", "Perahu Nelayan Labuan Bajo",
  "Kabut Pagi Kebun Teh Puncak", "Arus Sungai Mahakam", "Tari Saman Aceh",
  "Gerhana Senja Pulau Padar", "Kereta Malam Stasiun Tugu", "Penyu Menetas Pantai Pangumbahan",
  "Kawah Ijen Api Biru", "Pacu Jalur Kuantan",
  // seed-photos
  "Hutan hujan tropis Sumatera", "Pemandangan sungai di Kalimantan", "Kebun binatang Papua", "Pantai Sulawesi",
];
const DUMMY_PREFIX = "[Dummy] ";
const SEED_EMAILS = [
  "admin@lakuna.foto",
  "contributor1@lakuna.foto", "contributor2@lakuna.foto", "contributor3@lakuna.foto",
  "user1@lakuna.foto", "user2@lakuna.foto", "user3@lakuna.foto",
];

async function main() {
  assertSafeTarget();
  console.log(APPLY ? "⚠️  MODE HAPUS (--apply)\n" : "🔎 DRY-RUN (tidak ada yang dihapus; tambahkan --apply untuk menghapus)\n");

  const photos = await prisma.photo.findMany({
    where: { OR: [{ title: { in: SEED_TITLES } }, { title: { startsWith: DUMMY_PREFIX } }] },
    select: {
      id: true, title: true, type: true, originalKey: true, thumbKey: true, watermarkKey: true, deletedAt: true,
      createdAt: true, updatedAt: true,
      _count: { select: { orderItems: true, downloads: true, licenses: true, Earning: true } },
    },
  });

  const hasTx = (p: (typeof photos)[number]) => p._count.orderItems + p._count.downloads + p._count.licenses + p._count.Earning > 0;
  const isEdited = (p: (typeof photos)[number]) => !INCLUDE_EDITED && p.updatedAt.getTime() - p.createdAt.getTime() > EDITED_AFTER_MS;
  const protectedWhy = new Map<string, string>();
  for (const p of photos) {
    if (hasTx(p)) protectedWhy.set(p.id, "pesanan/unduhan/lisensi/pendapatan");
    else if (KEEP_TITLES.has(p.title)) protectedWhy.set(p.id, "dilindungi lewat --keep");
    else if (isEdited(p)) protectedWhy.set(p.id, "sudah diedit (kemungkinan media asli)");
  }
  const protectedPhotos = photos.filter((p) => protectedWhy.has(p.id));
  const deletable = photos.filter((p) => !protectedWhy.has(p.id));

  console.log(`Foto cocok daftar seeder : ${photos.length}`);
  console.log(`  → akan dihapus         : ${deletable.length}`);
  console.log(`  → DILEWATI (dilindungi)  : ${protectedPhotos.length}`);
  for (const p of deletable) console.log(`     - ${p.type} "${p.title}"${p.deletedAt ? " (sudah soft-delete)" : ""}`);
  for (const p of protectedPhotos) console.log(`     ! dilewati ${p.type} "${p.title}" (${protectedWhy.get(p.id)})`);

  let accountsToDelete: { id: string; email: string }[] = [];
  if (ACCOUNTS) {
    const users = await prisma.user.findMany({
      where: { email: { in: SEED_EMAILS } },
      select: {
        id: true, email: true,
        _count: { select: { photos: true, orders: true, downloads: true, licenses: true, favorites: true, cartItems: true, Earning: true, Payout: true, VoucherRedemption: true } },
        subscription: { select: { id: true } },
        contributorBalance: { select: { id: true } },
      },
    });
    const deletedIds = new Set(deletable.map((p) => p.id));
    console.log(`\nAkun seeder ditemukan    : ${users.length}`);
    for (const u of users) {
      const ownPhotos = await prisma.photo.findMany({ where: { userId: u.id }, select: { id: true } });
      const remainingPhotos = ownPhotos.filter((p) => !deletedIds.has(p.id)).length;
      const c = u._count;
      const busy = remainingPhotos + c.orders + c.downloads + c.licenses + c.Earning + c.Payout + c.VoucherRedemption + (u.subscription ? 1 : 0) + (u.contributorBalance ? 1 : 0);
      if (busy > 0) console.log(`     ! dilewati ${u.email} (masih punya data: foto ${remainingPhotos}, pesanan ${c.orders}, langganan ${u.subscription ? 1 : 0}, dll)`);
      else { accountsToDelete.push({ id: u.id, email: u.email }); console.log(`     - akan dihapus ${u.email}`); }
    }
  }

  if (!APPLY) {
    console.log("\n(dry-run selesai — tidak ada perubahan)");
    return;
  }

  // File storage dulu (kunci masih terbaca), lalu baris database.
  if (FILES && deletable.length) {
    const { minioClient } = await import("../../src/config/minio.js");
    const { clipKeyFor } = await import("../../src/modules/photo/publicAssets.js");
    const bucket = process.env.MINIO_BUCKET!;
    let ok = 0, fail = 0;
    for (const p of deletable) {
      const keys = new Set([p.originalKey, p.thumbKey, p.watermarkKey, clipKeyFor(p.watermarkKey)].filter(Boolean) as string[]);
      for (const k of keys) {
        try { await minioClient.removeObject(bucket, k); ok++; } catch { fail++; }
      }
    }
    console.log(`\n🗑  File storage: ${ok} terhapus, ${fail} gagal/tidak ada`);
  }

  const ids = deletable.map((p) => p.id);
  if (ids.length) {
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { photoId: { in: ids } } }),
      prisma.favorite.deleteMany({ where: { photoId: { in: ids } } }),
      prisma.photo.deleteMany({ where: { id: { in: ids } } }), // PhotoCategory/Keyword/EventPhoto ikut (Cascade)
    ]);
    console.log(`\n✓ ${ids.length} foto dihapus dari database`);
  }

  for (const u of accountsToDelete) {
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
    await prisma.cartItem.deleteMany({ where: { userId: u.id } });
    await prisma.favorite.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`✓ akun dihapus: ${u.email}`);
  }
  console.log("\n✅ Selesai");
}

main()
  .catch((e) => {
    console.error("❌ Unseed gagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/**
 * Pembersih storage yang AMAN (bawaan = SIMULASI, tidak menghapus apa pun).
 *
 *   npm run storage:clean                       simulasi: tampilkan apa yang akan dihapus
 *   npm run storage:clean -- --apply --yes      hapus sungguhan
 *   npm run storage:clean -- --only=A,C         pilih kelompok (A, B, C) — lihat di bawah
 *
 * Kelompok kandidat (semuanya DIJAMIN tidak dipakai foto aktif / halaman Beranda):
 *   A  File foto/video yang sudah DIHAPUS (soft-delete) dan TIDAK punya pesanan, unduhan, lisensi,
 *      atau pendapatan terkait. (Hapus lunak di aplikasi tidak menghapus file.)
 *   B  Objek yatim di original/ thumb/ watermark/ clip/ yang tak dirujuk baris Photo mana pun.
 *   C  Berkas di cms/homepage/ yang kuncinya tidak muncul di Setting mana pun (versi hero/gambar lama).
 * Tidak pernah menyentuh: license/, avatars/, categories/, atau berkas yang dirujuk foto aktif.
 *
 * PENGAMAN (dibuat setelah insiden: database yang TIDAK berpasangan dengan storage membuat SEMUA berkas
 * tampak "yatim" dan terhapus):
 *   - --apply DITOLAK bila database dan MinIO beda lingkungan (satu lokal, satu jarak jauh), kecuali --allow-mixed.
 *   - --apply DITOLAK bila kandidat menghapus >25% berkas original/ (tanda DB tak cocok dengan storage),
 *     kecuali --allow-mass. Dalam simulasi, peringatannya tetap dicetak.
 *   - Selalu jalankan simulasi dulu dan periksa daftarnya.
 * Target jarak jauh wajib --yes untuk --apply. Membaca .env.production (npm run) seperti regen:clips.
 */
import { prisma } from "../src/config/db.js";
import { minioClient } from "../src/config/minio.js";
import { clipKeyFor } from "../src/modules/photo/publicAssets.js";

const BUCKET = process.env.MINIO_BUCKET!;
const apply = process.argv.includes("--apply");
const yes = process.argv.includes("--yes");
const allowMass = process.argv.includes("--allow-mass");
const allowMixed = process.argv.includes("--allow-mixed");
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7).toUpperCase();
const groupsOn = new Set((onlyArg ? onlyArg.split(",") : ["A", "B", "C"]).map((s) => s.trim()));
const mb = (n: number) => (n / 1048576).toFixed(1).padStart(9) + " MB";
const isLocal = (h: string) => /^(localhost|127\.0\.0\.1|::1|\[::1\])/.test(h);

async function main() {
	let dbHost = "?";
	try { dbHost = new URL(process.env.DATABASE_URL ?? "").hostname; } catch { /* abaikan */ }
	const remote = !isLocal(dbHost) || !isLocal(String(process.env.MINIO_ENDPOINT));
	console.log(`🎯 Database: ${dbHost} | MinIO: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT} bucket=${BUCKET} | mode: ${apply ? "HAPUS SUNGGUHAN" : "SIMULASI"}`);
	if (apply && remote && !yes) throw new Error("Target jarak jauh: tambahkan --yes bersama --apply bila memang disengaja.");
	const mixed = isLocal(dbHost) !== isLocal(String(process.env.MINIO_ENDPOINT));
	if (mixed) console.log("⚠  Database dan MinIO berbeda lingkungan (satu lokal, satu jarak jauh): daftar yatim TIDAK bisa dipercaya.");
	if (apply && mixed && !allowMixed) throw new Error("Ditolak: database dan MinIO beda lingkungan. Perbaiki .env.production (atau --allow-mixed bila yakin).");

	const objs = new Map<string, number>();
	await new Promise<void>((res, rej) => {
		const s = minioClient.listObjectsV2(BUCKET, "", true);
		s.on("data", (o) => o.name && objs.set(o.name, o.size ?? 0));
		s.on("end", () => res());
		s.on("error", rej);
	});

	const photos = await prisma.photo.findMany({
		select: {
			id: true, title: true, deletedAt: true, originalKey: true, thumbKey: true, watermarkKey: true,
			_count: { select: { orderItems: true, downloads: true, licenses: true, Earning: true, cartItems: true, favorites: true } },
		},
	});
	const keysOf = (p: { originalKey: string; thumbKey: string; watermarkKey: string }) =>
		[p.originalKey, p.thumbKey, p.watermarkKey, clipKeyFor(p.watermarkKey)].filter(Boolean) as string[];

	const liveKeys = new Set<string>();
	for (const p of photos) if (!p.deletedAt) keysOf(p).forEach((k) => liveKeys.add(k));
	const allPhotoKeys = new Set<string>();
	for (const p of photos) keysOf(p).forEach((k) => allPhotoKeys.add(k));

	const cand = new Map<string, { group: string; why: string }>();
	const skipped: string[] = [];
	if (groupsOn.has("A")) {
		for (const p of photos) {
			if (!p.deletedAt) continue;
			const c = p._count;
			const used = c.orderItems + c.downloads + c.licenses + c.Earning;
			if (used > 0) { skipped.push(`${p.title} (pesanan ${c.orderItems}, unduhan ${c.downloads}, lisensi ${c.licenses}, pendapatan ${c.Earning})`); continue; }
			for (const k of keysOf(p)) if (objs.has(k) && !liveKeys.has(k)) cand.set(k, { group: "A", why: `foto dihapus: ${p.title}` });
		}
	}
	if (groupsOn.has("B")) {
		for (const k of objs.keys()) {
			if (/^(original|thumb|watermark|clip)\//.test(k) && !allPhotoKeys.has(k) && !cand.has(k)) cand.set(k, { group: "B", why: "tak dirujuk Photo mana pun" });
		}
	}
	if (groupsOn.has("C")) {
		const settings = (await prisma.setting.findMany({ select: { value: true } })).map((s) => s.value).join("\n");
		for (const k of objs.keys()) {
			if (k.startsWith("cms/homepage/") && !settings.includes(k) && !cand.has(k)) cand.set(k, { group: "C", why: "tak ada di Setting mana pun" });
		}
	}

	const byGroup = new Map<string, { n: number; size: number }>();
	let total = 0;
	for (const [k, v] of cand) {
		const sz = objs.get(k) ?? 0; total += sz;
		const e = byGroup.get(v.group) ?? { n: 0, size: 0 }; e.n++; e.size += sz; byGroup.set(v.group, e);
	}
	// Pengaman massal: bila kandidat melahap sebagian besar original/, hampir pasti DB tak cocok dengan storage.
	const origTotal = [...objs.keys()].filter((k) => k.startsWith("original/")).length;
	const origCand = [...cand.keys()].filter((k) => k.startsWith("original/")).length;
	const massive = origTotal >= 5 && origCand / origTotal > 0.25;
	if (massive) {
		console.log(`\n⚠⚠  PERINGATAN: ${origCand} dari ${origTotal} berkas original/ (${((origCand / origTotal) * 100).toFixed(0)}%) jadi kandidat hapus.`);
		console.log("    Itu hampir pasti berarti DATABASE TIDAK BERPASANGAN dengan storage ini (DB salah / kosong), bukan sampah sungguhan.");
	}
	console.log(`\nStorage sekarang: ${objs.size} objek, ${mb([...objs.values()].reduce((a, b) => a + b, 0))}`);
	console.log("\nKandidat hapus per kelompok:");
	for (const g of ["A", "B", "C"]) if (groupsOn.has(g)) console.log(`  ${g}  ${String(byGroup.get(g)?.n ?? 0).padStart(5)} objek ${mb(byGroup.get(g)?.size ?? 0)}`);
	console.log(`  → total yang bisa dibebaskan: ${mb(total)}`);
	console.log("\n20 terbesar:");
	for (const [k, v] of [...cand.entries()].sort((a, b) => (objs.get(b[0]) ?? 0) - (objs.get(a[0]) ?? 0)).slice(0, 20)) {
		console.log(`  ${mb(objs.get(k) ?? 0)}  [${v.group}] ${k}  — ${v.why}`);
	}
	if (skipped.length) {
		console.log(`\nDILEWATI (dihapus lunak tapi punya riwayat transaksi — file dipertahankan): ${skipped.length}`);
		for (const s of skipped.slice(0, 10)) console.log(`  - ${s}`);
	}

	if (apply && massive && !allowMass) {
		throw new Error("Ditolak: kandidat menghapus >25% berkas original/. Periksa DATABASE_URL & bucket; bila memang benar, ulangi dengan --allow-mass.");
	}
	if (!apply) {
		console.log("\nSIMULASI selesai — tidak ada yang dihapus. Untuk menghapus: npm run storage:clean -- --apply --yes");
	} else {
		const names = [...cand.keys()];
		let done = 0;
		for (let i = 0; i < names.length; i += 500) {
			const batch = names.slice(i, i + 500);
			await minioClient.removeObjects(BUCKET, batch);
			done += batch.length;
		}
		console.log(`\n✓ ${done} objek dihapus (${mb(total)} dibebaskan).`);
		console.log("Catatan: ruang bisa baru terlihat bebas di Railway beberapa saat kemudian; cek 'Volume' di dashboard.");
	}
	await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e.message ?? e); await prisma.$disconnect(); process.exit(1); });

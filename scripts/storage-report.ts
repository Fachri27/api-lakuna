/**
 * Laporan pemakaian storage (BACA-SAJA — tidak menghapus apa pun).
 * Dipakai saat MinIO penuh ("XMinioStorageFull ... minimum free drive threshold").
 *
 *   npm run storage:report        (membaca .env.production, sama seperti regen:clips)
 *
 * Menampilkan: ukuran per awalan (original/, clip/, watermark/, thumb/, cms/…), 15 berkas
 * terbesar, dan berkas `original/` yang TIDAK dirujuk baris Photo mana pun (yatim) — termasuk
 * foto yang sudah dihapus lunak (deletedAt), karena hapus lunak tidak menghapus file.
 */
import { prisma } from "../src/config/db.js";
import { minioClient } from "../src/config/minio.js";
import { clipKeyFor } from "../src/modules/photo/publicAssets.js";

const BUCKET = process.env.MINIO_BUCKET!;
const mb = (n: number) => (n / 1048576).toFixed(1).padStart(9) + " MB";

async function main() {
	let dbHost = "?";
	try { dbHost = new URL(process.env.DATABASE_URL ?? "").hostname; } catch { /* abaikan */ }
	console.log(`🎯 Database: ${dbHost} | MinIO: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT} bucket=${BUCKET}\n`);

	const objs: { name: string; size: number }[] = [];
	await new Promise<void>((res, rej) => {
		const s = minioClient.listObjectsV2(BUCKET, "", true);
		s.on("data", (o) => o.name && objs.push({ name: o.name, size: o.size ?? 0 }));
		s.on("end", () => res());
		s.on("error", rej);
	});
	const total = objs.reduce((n, o) => n + o.size, 0);
	console.log(`Total: ${objs.length} objek, ${mb(total)}\n`);

	const by = new Map<string, { n: number; size: number }>();
	for (const o of objs) {
		const k = o.name.includes("/") ? o.name.split("/").slice(0, o.name.startsWith("cms/") ? 2 : 1).join("/") + "/" : "(akar)";
		const e = by.get(k) ?? { n: 0, size: 0 };
		e.n++; e.size += o.size; by.set(k, e);
	}
	console.log("Per awalan:");
	for (const [k, v] of [...by.entries()].sort((a, b) => b[1].size - a[1].size)) {
		console.log(`  ${k.padEnd(24)} ${String(v.n).padStart(6)} objek ${mb(v.size)}  (${((v.size / (total || 1)) * 100).toFixed(0)}%)`);
	}

	console.log("\n15 berkas terbesar:");
	for (const o of [...objs].sort((a, b) => b.size - a.size).slice(0, 15)) console.log(`  ${mb(o.size)}  ${o.name}`);

	// Berkas asli yang tak dirujuk Photo (termasuk yang hapus lunak = masih dirujuk barisnya, ditandai terpisah).
	const photos = await prisma.photo.findMany({ select: { originalKey: true, thumbKey: true, watermarkKey: true, deletedAt: true } });
	const live = new Set<string>();
	const deletedKeys = new Set<string>();
	for (const p of photos) {
		const keys = [p.originalKey, p.thumbKey, p.watermarkKey, clipKeyFor(p.watermarkKey)].filter(Boolean) as string[];
		for (const k of keys) (p.deletedAt ? deletedKeys : live).add(k);
	}
	const sum = (pred: (o: { name: string; size: number }) => boolean) => objs.filter(pred).reduce((n, o) => n + o.size, 0);
	const orphan = objs.filter((o) => /^(original|thumb|watermark|clip)\//.test(o.name) && !live.has(o.name) && !deletedKeys.has(o.name));
	const soft = objs.filter((o) => deletedKeys.has(o.name) && !live.has(o.name));
	console.log(`\nFoto/video dihapus lunak (file MASIH di storage): ${soft.length} objek, ${mb(soft.reduce((n, o) => n + o.size, 0))}`);
	console.log(`Objek yatim (tak dirujuk baris Photo mana pun): ${orphan.length} objek, ${mb(orphan.reduce((n, o) => n + o.size, 0))}`);
	console.log(`Aset yang dipakai foto aktif: ${mb(sum((o) => live.has(o.name)))}`);
	console.log("\n(Laporan ini tidak menghapus apa pun. Hapus lewat CMS/skrip terpisah setelah kamu memeriksa daftarnya.)");
	await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

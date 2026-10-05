/**
 * Regenerasi SEKALI JALAN aset publik semua foto/video dari file asli,
 * mengikuti aturan publicAssets.ts (kecil, resolusi rendah, ber-watermark):
 *   thumbKey      → thumbnail 480 px ber-watermark
 *   watermarkKey  → pratinjau foto 1000 px / video 640 px, ber-watermark
 * File asli (originalKey) TIDAK disentuh. Aman diulang (menimpa key yang sama).
 *
 * Jalankan dari folder api (MinIO harus bisa dijangkau lewat MINIO_ENDPOINT):
 *   node --env-file=.env --import tsx/esm scripts/regen-public-assets.ts
 * Perbaiki klip kartu video di PRODUKSI (tanpa menempel kredensial di baris perintah):
 *   1. cp .env.production.example .env.production   (isi nilainya; berkas ini di-ignore Git)
 *   2. npm run regen:clips -- --check               (hanya melaporkan klip yang rusak)
 *   3. npm run regen:clips                          (membuat ulang HANYA klip yang rusak)
 *
 * Opsi: --only=<photoId>[,<photoId>...] untuk item tertentu;
 *       --broken-only (dengan --clips-only) lewati klip yang sehat, buat ulang yang rusak/tak ada;
 *       --check       (dengan --broken-only) hanya melaporkan, tidak menulis apa pun;
 *       --thumbs-only hanya membuat ulang thumbnail kartu;
 *       --clips-only hanya membuat klip kartu video (tanpa watermark).
 */
import { mkdtempSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { join } from "path";
import { prisma } from "../src/config/db.js";
import { minioClient } from "../src/config/minio.js";
import { uploadBuffer } from "../src/utils/uploadToMinio.js";
import { makeThumb, makePreviewImage, makePreviewVideo, grabVideoFrame, makeClipVideo, clipKeyFor } from "../src/modules/photo/publicAssets.js";

const BUCKET = process.env.MINIO_BUCKET!;
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
// --thumbs-only: hanya thumbnail kartu. Video tidak diunduh utuh — ffmpeg
// mengambil satu frame langsung dari URL (seek via range request).
const thumbsOnly = process.argv.includes("--thumbs-only");
// --clips-only: hanya klip kartu video (8 dtk awal, tanpa watermark); ffmpeg
// membaca langsung dari URL, video tidak diunduh utuh.
const clipsOnly = process.argv.includes("--clips-only");
const brokenOnly = process.argv.includes("--broken-only");
const checkOnly = process.argv.includes("--check");

/** Tampilkan target (TANPA kredensial) supaya jelas skrip ini menulis ke mana. */
function describeTarget() {
	let dbHost = "?";
	try { dbHost = new URL(process.env.DATABASE_URL ?? "").hostname; } catch { /* abaikan */ }
	const minio = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
	const isLocal = (h: string) => /^(localhost|127\.0\.0\.1|::1|\[::1\])/.test(h);
	console.log(`🎯 Database: ${dbHost} (${isLocal(dbHost) ? "LOKAL" : "jarak jauh"}) | MinIO: ${minio} bucket=${BUCKET} (${isLocal(String(process.env.MINIO_ENDPOINT)) ? "LOKAL" : "jarak jauh"})`);
	if (isLocal(dbHost) !== isLocal(String(process.env.MINIO_ENDPOINT))) {
		console.log("⚠  Database dan MinIO berbeda lingkungan (satu lokal, satu jarak jauh). Pastikan ini disengaja.");
	}
	if (isLocal(dbHost) && isLocal(String(process.env.MINIO_ENDPOINT))) {
		console.log("⚠  Target LOKAL: ini TIDAK memperbaiki klip di produksi. Isi DATABASE_URL & MINIO_* produksi di .env.production, lalu jalankan: npm run regen:clips");
	}
}

/** Periksa klip hasil enkode sebelum diunggah: harus MP4 valid, ada durasinya, dan punya dimensi. */
function probeClip(path: string): { w: number; h: number; dur: number } {
	const out = execSync(
		`"${process.env.FFPROBE_BIN || "ffprobe"}" -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of csv=p=0:s=x "${path}"`,
		{ stdio: "pipe" },
	).toString().trim().split(/\s+/);
	const [wh, dur] = [out[0] ?? "", Number(out[1])];
	const [w, h] = wh.split("x").map(Number);
	if (!w || !h || !(dur > 1)) throw new Error(`klip hasil enkode tidak valid (${out.join(" ")})`);
	return { w, h, dur };
}

async function getBuffer(key: string): Promise<Buffer> {
	const chunks: Buffer[] = [];
	const stream = await minioClient.getObject(BUCKET, key);
	for await (const c of stream as unknown as AsyncIterable<Buffer>) chunks.push(c);
	return Buffer.concat(chunks);
}

async function main() {
	describeTarget();
	const photos = await prisma.photo.findMany({
		where: { deletedAt: null, ...(only ? { id: { in: only.split(",") } } : {}) },
		select: { id: true, title: true, type: true, originalKey: true, thumbKey: true, watermarkKey: true },
	});
	console.log(`ditemukan ${photos.length} item`);
	let ok = 0;
	let skipped = 0;
	for (const p of photos) {
		try {
			if (clipsOnly) {
				const clipKey = clipKeyFor(p.watermarkKey);
				if (p.type !== "VIDEO" || !clipKey) continue;
				if (brokenOnly) {
					// Klip sehat = bisa dibaca ffprobe lewat URL (MP4 valid, ada dimensi & durasi); selain itu dibuat ulang.
					let healthy: string | null = null;
					try {
						const cu = await minioClient.presignedGetObject(BUCKET, clipKey, 600);
						const o = execSync(
							`"${process.env.FFPROBE_BIN || "ffprobe"}" -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of csv=p=0:s=x "${cu}"`,
							{ stdio: "pipe", timeout: 60_000 },
						).toString().trim().split(/\s+/);
						const [w, h] = (o[0] ?? "").split("x").map(Number);
						if (w && h && Number(o[1]) > 1) healthy = `${w}x${h}`;
					} catch { /* rusak / tidak ada */ }
					if (healthy) {
						skipped++;
						console.log(`lewati  ${p.title} (klip sehat ${healthy})`);
						continue;
					}
					if (checkOnly) {
						console.log(`RUSAK   ${p.title}  [${p.id}]`);
						continue;
					}
				}
				const dir = mkdtempSync(join(tmpdir(), "regen-"));
				const op = join(dir, "clip.mp4");
				const url = await minioClient.presignedGetObject(BUCKET, p.originalKey, 3600);
				if (!makeClipVideo(url, op)) throw new Error("ffmpeg klip gagal");
				const info = probeClip(op);
				const buf = readFileSync(op);
				await uploadBuffer(clipKey, buf, "video/mp4");
				// Verifikasi: objek di storage harus sebesar yang diunggah.
				const stat = await minioClient.statObject(BUCKET, clipKey);
				if (stat.size !== buf.length) throw new Error(`ukuran di storage ${stat.size} ≠ ${buf.length}`);
				try { unlinkSync(op); } catch {}
				ok++;
				console.log(`ok clip ${p.title} → ${info.w}x${info.h}, ${info.dur.toFixed(0)} dtk, ${(buf.length / 1048576).toFixed(1)} MB (terverifikasi di storage)`);
				continue;
			}
			if (thumbsOnly) {
				let src: Buffer;
				if (p.type === "VIDEO") {
					const dir = mkdtempSync(join(tmpdir(), "regen-"));
					const fp = join(dir, "frame.jpg");
					const url = await minioClient.presignedGetObject(BUCKET, p.originalKey, 3600);
					execSync(`"${process.env.FFMPEG_BIN || "ffmpeg"}" -ss 00:00:01 -i "${url}" -frames:v 1 -q:v 3 "${fp}" -y`, { stdio: "pipe" });
					src = readFileSync(fp);
					try { unlinkSync(fp); } catch {}
				} else {
					src = await getBuffer(p.originalKey);
				}
				const thumb = await makeThumb(src, p.id);
				await uploadBuffer(p.thumbKey, thumb, "image/jpeg");
				ok++;
				console.log(`ok thumb ${p.type} ${p.title} (${(thumb.length / 1024).toFixed(0)} KB)`);
				continue;
			}
			if (p.type === "VIDEO") {
				const dir = mkdtempSync(join(tmpdir(), "regen-"));
				const vp = join(dir, "in.mp4");
				const fp = join(dir, "frame.jpg");
				const op = join(dir, "preview.mp4");
				// Unduh ke disk lewat curl + URL presigned: video bisa berukuran GB
				// dan klien Node (getBuffer/fGetObject) memutus koneksinya
				// ("socket hang up") di tengah jalan.
				const url = await minioClient.presignedGetObject(BUCKET, p.originalKey, 3600);
				// curl di host (macOS); container alpine hanya punya wget busybox.
				execSync(`if command -v curl >/dev/null; then curl -sS --fail --retry 3 -o "${vp}" "${url}"; else wget -q -O "${vp}" "${url}"; fi`, { stdio: "pipe" });
				if (grabVideoFrame(vp, fp)) {
					await uploadBuffer(p.thumbKey, await makeThumb(readFileSync(fp), p.id), "image/jpeg");
				}
				if (p.watermarkKey && (await makePreviewVideo(vp, op)) && existsSync(op)) {
					const buf = readFileSync(op);
					await uploadBuffer(p.watermarkKey, buf, "video/mp4");
					console.log(`  pratinjau video ${(buf.length / 1024).toFixed(0)} KB`);
				}
				const clipKey = clipKeyFor(p.watermarkKey);
				const cp = join(dir, "clip.mp4");
				if (clipKey && makeClipVideo(vp, cp)) {
					await uploadBuffer(clipKey, readFileSync(cp), "video/mp4");
					try { unlinkSync(cp); } catch {}
				}
				for (const f of [vp, fp, op]) {
					try { unlinkSync(f); } catch {}
				}
			} else {
				const orig = await getBuffer(p.originalKey);
				const thumb = await makeThumb(orig, p.id);
				await uploadBuffer(p.thumbKey, thumb, "image/jpeg");
				if (p.watermarkKey) {
					const prev = await makePreviewImage(orig, p.id);
					await uploadBuffer(p.watermarkKey, prev, "image/jpeg");
					console.log(`  thumb ${(thumb.length / 1024).toFixed(0)} KB, pratinjau ${(prev.length / 1024).toFixed(0)} KB`);
				}
			}
			ok++;
			console.log(`ok ${p.type} ${p.title}`);
		} catch (e) {
			console.error(`GAGAL ${p.id} ${p.title}:`, (e as Error).message);
		}
	}
	console.log(`selesai: ${ok}/${photos.length}${skipped ? ` (dilewati ${skipped} klip sehat)` : ""}`);
	await prisma.$disconnect();
}

main().catch(async (e) => {
	console.error(e);
	await prisma.$disconnect();
	process.exit(1);
});

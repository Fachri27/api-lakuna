import { basename } from "path";
import { Client } from "minio";

// MINIO_ENDPOINT boleh host saja ("localhost") atau URL lengkap
// ("https://storage.railway.app") — Railway Storage Bucket memberi ENDPOINT
// dalam bentuk URL. Dari URL, port & SSL diturunkan otomatis.
const rawEndpoint = process.env.MINIO_ENDPOINT;
let endpointUrl: URL | null = null;
if (rawEndpoint && /^https?:\/\//i.test(rawEndpoint)) {
  try {
    endpointUrl = new URL(rawEndpoint);
  } catch {
    throw new Error(`MINIO_ENDPOINT bukan URL valid: ${rawEndpoint}`);
  }
}
const endpoint = endpointUrl ? endpointUrl.hostname : rawEndpoint;
// Host tunnel Cloudflare hanya melayani https:443. Watchdog/skrip tunnel
// mengganti MINIO_ENDPOINT; bila MINIO_PORT/MINIO_USE_SSL tertinggal di
// setelan localhost (9000/http), URL presigned jadi http://<tunnel>:9000 —
// tak bisa dibuka & diblokir CSP. Paksa pasangan yang benar untuk tunnel.
const isTunnelHost = !!endpoint && /\.trycloudflare\.com$/i.test(endpoint);
const port = isTunnelHost
  ? "443"
  : endpointUrl
    ? endpointUrl.port || (endpointUrl.protocol === "https:" ? "443" : "80")
    : process.env.MINIO_PORT;
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET;
const minioUseSSL = endpointUrl
  ? endpointUrl.protocol === "https:"
  : isTunnelHost || (process.env.MINIO_USE_SSL ?? "false").toLowerCase() === "true";
// Use empty region for localhost MinIO (filesystem backend)
const minioRegion = process.env.MINIO_REGION || "";

if (!endpoint) throw new Error("MINIO_ENDPOINT is required");
if (!port) throw new Error("MINIO_PORT is required");
if (!accessKey) throw new Error("MINIO_ACCESS_KEY is required");
if (!secretKey) throw new Error("MINIO_SECRET_KEY is required");
if (!bucket) throw new Error("MINIO_BUCKET is required");

const MINIO_BUCKET: string = bucket;

const clientOptions: any = {
  endPoint: endpoint,
  port: Number(port),
  useSSL: minioUseSSL,
  accessKey,
  secretKey,
};

// Only add region if not empty
if (minioRegion) {
  clientOptions.region = minioRegion;
}

/**
 * Dua klien:
 *   minioClient        — SEMUA baca/tulis (put, stat, get). Lewat jalur
 *                        internal (MINIO_INTERNAL_*), mis. host docker
 *                        "minio:9000". Dulu lewat tunnel publik: unggahan
 *                        video GB putus di tengah jalan dan socket basi
 *                        menjatuhkan API.
 *   minioPublicClient  — HANYA menandatangani URL untuk browser (host publik /
 *                        tunnel masuk ke tanda tangan). Region diisi supaya
 *                        presign tak perlu menghubungi server sama sekali.
 * Tanpa MINIO_INTERNAL_* keduanya memakai endpoint yang sama (perilaku lama).
 */
const internalEndpoint = process.env.MINIO_INTERNAL_ENDPOINT || endpoint;
const internalPort = Number(process.env.MINIO_INTERNAL_PORT || port);
const internalUseSSL = process.env.MINIO_INTERNAL_USE_SSL
  ? process.env.MINIO_INTERNAL_USE_SSL.toLowerCase() === "true"
  : process.env.MINIO_INTERNAL_ENDPOINT
    ? false
    : minioUseSSL;

export const minioClient = new Client({
  ...clientOptions,
  endPoint: internalEndpoint,
  port: internalPort,
  useSSL: internalUseSSL,
});

export const minioPublicClient = new Client({
  ...clientOptions,
  region: minioRegion || "us-east-1",
});

// DEBUG: log minio connection info (masked)
try {
  const masked = `${accessKey}:***${String(secretKey).slice(-3)}`;
  console.log(
    `MinIO client configured -> internal=${internalEndpoint}:${internalPort} (ssl=${internalUseSSL}) public=${endpoint}:${port} (ssl=${minioUseSSL}) access=${masked}`,
  );
} catch (e) {}

// Initialize CORS configuration for the bucket via HTTP
export async function initializeMinIOBucketCORS() {
  try {
    console.log(`✓ CORS configuration setup for bucket: ${MINIO_BUCKET}`);
    // Note: CORS should be configured via MinIO dashboard or CLI:
    // mc cors set minio/bucket --acp "public"
  } catch (error) {
    console.warn(`⚠ Could not set CORS on bucket:`, error);
  }
}

const missingLogged = new Set<string>();

export async function getPresignedUrl(
  objectName: string,
  expirySeconds: number = 3600,
  // Tampilan (thumbnail/preview di grid) = inline: tampil di browser, tidak
  // mengundang dialog download. Unduhan berbayar memanggil dengan
  // "attachment" eksplisit. Default inline karena mayoritas pemanggil adalah
  // display; hanya modul downloads yang memakai attachment.
  disposition: "inline" | "attachment" = "inline",
) {
  try {
    // Objek yang hilang di storage (key yatim dari seed) langsung gagal di
    // sini — pemanggil menangkapnya dan memakai fallback picsum, jadi browser
    // tak pernah menerima URL presigned yang berujung 404.
    await minioClient.statObject(MINIO_BUCKET, objectName);
    // Default 1 hour (3600 seconds) for better reliability
    const url = await minioPublicClient.presignedGetObject(
      MINIO_BUCKET,
      objectName,
      expirySeconds,
      {
        "response-content-disposition":
          disposition === "attachment"
            ? `attachment; filename="${basename(objectName)}"`
            : "inline",
      },
    );

    // Fix endpoint issues
    let finalUrl = url;

    // If using non-SSL localhost, replace with proper endpoint
    if (!minioUseSSL && endpoint?.includes("localhost")) {
      finalUrl = url.replace("https://", "http://");
    }

    // Satu baris per gambar: berguna di dev, banjir log di produksi.
    if (process.env.NODE_ENV !== "production") console.log(`✓ Generated presigned URL for: ${objectName}`);
    return finalUrl;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "NotFound" || code === "NoSuchKey" || code === "NoSuchBucket") {
      // Objek yatim (key ada di DB, file tak ada di storage): normal sesudah
      // pindah storage. Satu baris per key, sekali saja — stack trace per
      // request membanjiri log (Railway membuang >500 baris/detik).
      if (missingLogged.size < 1000 && !missingLogged.has(objectName)) {
        missingLogged.add(objectName);
        console.warn(`[minio] ${code}: ${objectName}`);
      }
    } else {
      console.error(`Failed to generate presigned URL for ${objectName}:`, error);
    }
    throw error;
  }
}

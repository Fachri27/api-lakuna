/**
 * Batas ukuran file upload dalam MB (env UPLOAD_MAX_MB, default 2048 = 2 GB)
 * supaya video panjang tidak ditolak.
 * Catatan: multer memakai memory storage, jadi seluruh file ditahan di RAM
 * selama diproses — batas ini juga batas pemakaian memori per upload.
 */
export const UPLOAD_MAX_MB =
  Number(process.env.UPLOAD_MAX_MB) > 0 ? Number(process.env.UPLOAD_MAX_MB) : 2048;

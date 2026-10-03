import { Xendit } from "xendit-node";

/**
 * Klien Xendit untuk alur checkout keranjang (cart → invoice → redirect).
 * Subscription & standar purchase MASIH memakai Midtrans (config/midtrans.ts).
 *
 * Secret key dari env XENDIT_SECRET_KEY (pakai key test `xnd_development_*`
 * untuk dev). Callback token (XENDIT_CALLBACK_TOKEN) wajib di production —
 * bila kosong di production, webhook ditolak (fail-closed); bila kosong di
 * non-prod, webhook dianggap valid khusus dev lokal + console.warn.
 */
const secretKey = process.env.XENDIT_SECRET_KEY;

if (!secretKey) {
  console.warn("[xendit] XENDIT_SECRET_KEY belum diset — alur checkout cart akan gagal.");
}

export const xenditClient = new Xendit({ secretKey: secretKey || "xnd_development_missing" });

/** Module Invoice — createInvoice / getInvoiceById. */
export const xenditInvoice = xenditClient.Invoice;

/** Verifikasi webhook Xendit: bandingkan header x-callback-token dengan token
 * dari dashboard. Fail-closed di production bila token tidak dikonfigurasi;
 * di non-prod pertahankan perilaku dev (terima) + peringatan jelas. */
export function verifyXenditCallback(callbackToken: string | undefined): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV === "production") return false;
    console.warn(
      "[xendit] XENDIT_CALLBACK_TOKEN belum diset — verifikasi webhook dilewati (hanya untuk dev/non-prod, JANGAN dipakai di production)."
    );
    return true; // dev: tidak ada token → terima
  }
  return !!callbackToken && callbackToken === expected;
}
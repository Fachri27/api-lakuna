import PDFDocument from "pdfkit";
import { uploadBuffer } from "./uploadToMinio.js";
export async function generateLicensePdf(license) {
    return new Promise(async (resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({
            size: "A4",
            margin: 40,
            info: {
                Title: `License ${license.id}`,
                Author: "Lakuna Foto",
                Subject: "Photo License Certificate",
            },
        });
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const licenseKey = `license/license-${license.id}.pdf`;
            try {
                await uploadBuffer(licenseKey, pdfBuffer, "application/pdf");
                resolve(licenseKey);
            }
            catch (err) {
                reject(err);
            }
        });
        doc.on("error", reject);
        const formatDate = (date) => {
            if (!date)
                return "-";
            return new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }).format(date);
        };
        const prettyType = license.licenseType === "SUBSCRIBE" ? "Subscription" : "Standar";
        // ===== HEADER SECTION =====
        // Top decorative bar
        doc.fillColor("#1a56db").rect(0, 0, 595, 12).fill();
        // Header background
        doc.fillColor("#f0f9ff").rect(0, 12, 595, 110).fill();
        // Logo
        doc
            .fillColor("#1a56db")
            .font("Helvetica-Bold")
            .fontSize(28)
            .text("LAKUNA FOTO", 50, 35);
        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#0369a1")
            .text("LICENSE CERTIFICATE", 50, 68);
        // Checkmark badge on right
        doc.save();
        doc.fillColor("#10b981");
        doc.circle(530, 65, 22).fill();
        doc.restore();
        doc
            .fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(28)
            .text("✓", 520, 52);
        // ===== MAIN TITLE =====
        doc
            .fillColor("#1f2937")
            .font("Helvetica-Bold")
            .fontSize(16)
            .text("SERTIFIKAT LISENSI PENGGUNAAN ASET DIGITAL", 50, 140);
        // ===== SUBTITLE =====
        doc
            .fillColor("#6b7280")
            .font("Helvetica")
            .fontSize(9)
            .text("Dokumen ini menjadi bukti sah kepemilikan dan hak penggunaan aset digital Anda dari Lakuna Foto sesuai dengan jenis lisensi yang telah dipilih dan dibayarkan.", 50, 162, { width: 495, lineGap: 2 });
        // ===== INFO SECTION =====
        const infoY = 200;
        const colWidth = 245;
        const rowHeight = 60;
        // Background for info section
        doc.fillColor("#ffffff").rect(50, infoY, 495, 240).fill();
        doc.strokeColor("#e5e7eb").lineWidth(1).rect(50, infoY, 495, 240).stroke();
        // Helper function to draw info boxes
        const drawInfoBox = (label, value, x, y) => {
            // Vertical divider
            if (x > 50) {
                doc
                    .strokeColor("#f3f4f6")
                    .lineWidth(1)
                    .moveTo(x - 5, y)
                    .lineTo(x - 5, y + 55)
                    .stroke();
            }
            // Label
            doc
                .font("Helvetica")
                .fontSize(7)
                .fillColor("#9ca3af")
                .text(label, x + 15, y + 8);
            // Value
            doc
                .font("Helvetica-Bold")
                .fontSize(10)
                .fillColor("#1f2937")
                .text(value.substring(0, 40), x + 15, y + 22, { width: 220 });
        };
        // Row 1
        drawInfoBox("LICENSE ID", license.id, 50, infoY + 15);
        drawInfoBox("JENIS LISENSI", prettyType, 295, infoY + 15);
        // Row 2
        drawInfoBox("JUDUL FOTO", license.photoTitle, 50, infoY + 60);
        drawInfoBox("FOTOGRAFER", license.photographer || "-", 295, infoY + 60);
        // Row 3
        drawInfoBox("PEMEGANG LISENSI", license.issuedTo || "-", 50, infoY + 120);
        drawInfoBox("TANGGAL TERBIT", formatDate(license.createdAt), 295, infoY + 120);
        // Row 4
        const expiryText = license.expiresAt
            ? `Sampai ${formatDate(license.expiresAt)}`
            : "Tidak Terbatas";
        drawInfoBox("MASA BERLAKU", expiryText, 50, infoY + 180);
        drawInfoBox("REFERENSI ORDER", license.orderId || "-", 295, infoY + 180);
        // ===== TERMS SECTION =====
        const termsY = 460;
        // Terms header with blue background
        doc.fillColor("#1a56db").rect(50, termsY, 495, 25).fill();
        doc
            .fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("KETENTUAN PENGGUNAAN LISENSI", 65, termsY + 6);
        // Terms content
        doc
            .fillColor("#f3f4f6")
            .rect(50, termsY + 25, 495, 90)
            .fill();
        const terms = [
            "Aset digital hanya dapat digunakan oleh pemegang lisensi sesuai dengan paket yang telah dipilih.",
            "Dilarang menjual kembali, membagikan file, atau memindahkan hak lisensi tanpa izin tertulis.",
            "Hak cipta tetap sepenuhnya milik fotografer dan/atau Lakuna Foto.",
        ];
        let termY = termsY + 33;
        doc.font("Helvetica").fontSize(8).fillColor("#374151");
        terms.forEach((term, index) => {
            doc
                .fillColor("#1a56db")
                .font("Helvetica-Bold")
                .text(`${index + 1}.`, 65, termY);
            doc
                .fillColor("#374151")
                .font("Helvetica")
                .fontSize(8)
                .text(term, 78, termY, { width: 460 });
            termY += 18;
        });
        // ===== FOOTER SECTION =====
        const footerY = 570;
        // Separator line
        doc
            .strokeColor("#e5e7eb")
            .lineWidth(1)
            .moveTo(50, footerY)
            .lineTo(545, footerY)
            .stroke();
        // Footer text
        doc.fillColor("#6b7280").font("Helvetica").fontSize(8);
        doc.text(`Diterbitkan otomatis pada ${formatDate(new Date())}`, 50, footerY + 10);
        doc.text("Verifikasi dokumen dengan License ID pada dashboard akun Anda", 50, footerY + 22);
        // Right footer
        doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor("#1a56db")
            .text("lakunafoto.com", 450, footerY + 10);
        doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#9ca3af")
            .text("www.lakunafoto.com", 450, footerY + 22);
        // Bottom decorative bar
        doc.fillColor("#1a56db").rect(0, 765, 595, 12).fill();
        doc.end();
    });
}
//# sourceMappingURL=generateLicensePdf.js.map
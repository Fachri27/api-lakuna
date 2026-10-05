-- Foto dua bahasa (ID/EN): judul & deskripsi Inggris, kata kunci per bahasa.
-- Aditif dan aman untuk data lama: kolom baru boleh NULL, kata kunci lama = "id".

-- Deskripsi lama hanya VARCHAR(191) padahal validasi API mengizinkan 500 karakter
-- (deskripsi 192-500 karakter gagal disimpan). Lebarkan, sekalian untuk kolom Inggris.
ALTER TABLE `Photo`
    ADD COLUMN `titleEn` VARCHAR(191) NULL,
    ADD COLUMN `descriptionEn` VARCHAR(500) NULL,
    MODIFY `description` VARCHAR(500) NULL;

ALTER TABLE `Keyword` ADD COLUMN `lang` VARCHAR(2) NOT NULL DEFAULT 'id';

-- Unik per (nama, bahasa): "Bali" boleh ada sebagai kata kunci ID dan EN.
DROP INDEX `Keyword_name_key` ON `Keyword`;
CREATE UNIQUE INDEX `Keyword_name_lang_key` ON `Keyword`(`name`, `lang`);

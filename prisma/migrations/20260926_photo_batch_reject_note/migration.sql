-- Unggahan multi-berkas (satu judul, dikurasi per berkas) + alasan penolakan.
ALTER TABLE `Photo` ADD COLUMN `batchId` VARCHAR(64) NULL,
    ADD COLUMN `rejectNote` VARCHAR(500) NULL;

CREATE INDEX `Photo_batchId_idx` ON `Photo`(`batchId`);

-- Kotak masuk formulir Customer service. Aditif: tabel baru, tidak menyentuh data lama.
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(24) NOT NULL,
    `orderId` VARCHAR(64) NULL,
    `message` VARCHAR(2000) NOT NULL,
    `status` VARCHAR(8) NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupportMessage_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

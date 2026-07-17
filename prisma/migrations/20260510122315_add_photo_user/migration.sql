/*
  Warnings:

  - You are about to alter the column `license` on the `CartItem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(6))`.
  - You are about to drop the column `license` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `licenseId` to the `Download` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseType` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CartItem` MODIFY `license` ENUM('STANDAR', 'SUBSCRIBE') NOT NULL;

-- AlterTable
ALTER TABLE `Download` ADD COLUMN `licenseId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `license`,
    ADD COLUMN `licenseType` ENUM('STANDAR', 'SUBSCRIBE') NOT NULL;

-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `License` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NOT NULL,
    `type` ENUM('STANDAR', 'SUBSCRIBE') NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `License_userId_idx`(`userId`),
    UNIQUE INDEX `License_userId_photoId_type_key`(`userId`, `photoId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Download` ADD CONSTRAINT `Download_licenseId_fkey` FOREIGN KEY (`licenseId`) REFERENCES `License`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

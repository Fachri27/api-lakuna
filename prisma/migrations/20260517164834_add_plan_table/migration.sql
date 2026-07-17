/*
  Warnings:

  - You are about to drop the `_KeywordToPhoto` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `planId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_KeywordToPhoto` DROP FOREIGN KEY `_KeywordToPhoto_A_fkey`;

-- DropForeignKey
ALTER TABLE `_KeywordToPhoto` DROP FOREIGN KEY `_KeywordToPhoto_B_fkey`;

-- AlterTable
ALTER TABLE `Photo` MODIFY `photographer` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `planId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_KeywordToPhoto`;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `quota` INTEGER NOT NULL,
    `priceMonthly` INTEGER NOT NULL,
    `priceAnnual` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

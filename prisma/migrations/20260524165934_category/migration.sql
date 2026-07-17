/*
  Warnings:

  - A unique constraint covering the columns `[midtransOrderId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `midtransOrderId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhotoCategory` (
    `id` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PhotoCategory_photoId_categoryId_key`(`photoId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Subscription_midtransOrderId_key` ON `Subscription`(`midtransOrderId`);

-- AddForeignKey
ALTER TABLE `PhotoCategory` ADD CONSTRAINT `PhotoCategory_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhotoCategory` ADD CONSTRAINT `PhotoCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

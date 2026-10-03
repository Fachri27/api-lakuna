-- Menyusul perubahan skema yang sebelumnya hanya dibuat lewat `db push` di lokal:
-- Category.imageKey, Photo.location, Plan (name/description/badge/highlight),
-- voucher (Voucher, VoucherRedemption, kolom di Order/Subscription), diskon event
-- (EventDiscount/EventPhoto/EventPlan), dan pendapatan kontributor
-- (Earning, ContributorBalance, Payout, SettlementRun).

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `imageKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `voucherId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `location` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Plan` ADD COLUMN `badge` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `highlight` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `voucherId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ContributorBalance` (
    `id` VARCHAR(191) NOT NULL,
    `contributorId` VARCHAR(191) NOT NULL,
    `pending` INTEGER NOT NULL DEFAULT 0,
    `paidOut` INTEGER NOT NULL DEFAULT 0,
    `lifetimeEarned` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContributorBalance_contributorId_key`(`contributorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Earning` (
    `id` VARCHAR(191) NOT NULL,
    `contributorId` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NULL,
    `source` ENUM('STANDAR', 'SUBSCRIPTION') NOT NULL,
    `amount` INTEGER NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `period` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Earning_contributorId_idx`(`contributorId`),
    INDEX `Earning_period_idx`(`period`),
    INDEX `Earning_photoId_fkey`(`photoId`),
    UNIQUE INDEX `Earning_orderId_photoId_source_key`(`orderId`, `photoId`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventDiscount` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `valueType` ENUM('PERCENT', 'NOMINAL') NOT NULL DEFAULT 'PERCENT',
    `value` INTEGER NOT NULL,
    `maxDiscount` INTEGER NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `targetType` ENUM('PHOTO', 'PLAN') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventDiscount_isActive_idx`(`isActive`),
    INDEX `EventDiscount_targetType_idx`(`targetType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NOT NULL,

    INDEX `EventPhoto_photoId_fkey`(`photoId`),
    UNIQUE INDEX `EventPhoto_eventId_photoId_key`(`eventId`, `photoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventPlan` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,

    INDEX `EventPlan_planId_fkey`(`planId`),
    UNIQUE INDEX `EventPlan_eventId_planId_key`(`eventId`, `planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `contributorId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'COMPLETED',
    `processedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `Payout_contributorId_idx`(`contributorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SettlementRun` (
    `id` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `totalPool` INTEGER NOT NULL,
    `totalDistributed` INTEGER NOT NULL,
    `ranAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ranBy` VARCHAR(191) NULL,

    UNIQUE INDEX `SettlementRun_period_key`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Voucher` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `scope` ENUM('ORDER', 'SUBSCRIPTION', 'BOTH') NOT NULL DEFAULT 'BOTH',
    `valueType` ENUM('PERCENT', 'NOMINAL') NOT NULL DEFAULT 'PERCENT',
    `value` INTEGER NOT NULL,
    `maxDiscount` INTEGER NULL,
    `minSpend` INTEGER NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `quotaTotal` INTEGER NULL,
    `quotaPerUser` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Voucher_code_key`(`code`),
    INDEX `Voucher_isActive_idx`(`isActive`),
    INDEX `Voucher_scope_idx`(`scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherRedemption` (
    `id` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `amountCut` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VoucherRedemption_orderId_idx`(`orderId`),
    INDEX `VoucherRedemption_subscriptionId_idx`(`subscriptionId`),
    INDEX `VoucherRedemption_userId_fkey`(`userId`),
    INDEX `VoucherRedemption_voucherId_userId_idx`(`voucherId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Order_voucherId_fkey` ON `Order`(`voucherId`);

-- CreateIndex
CREATE INDEX `Subscription_voucherId_fkey` ON `Subscription`(`voucherId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContributorBalance` ADD CONSTRAINT `ContributorBalance_contributorId_fkey` FOREIGN KEY (`contributorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Earning` ADD CONSTRAINT `Earning_contributorId_fkey` FOREIGN KEY (`contributorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Earning` ADD CONSTRAINT `Earning_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventPhoto` ADD CONSTRAINT `EventPhoto_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `EventDiscount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventPhoto` ADD CONSTRAINT `EventPhoto_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventPlan` ADD CONSTRAINT `EventPlan_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `EventDiscount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventPlan` ADD CONSTRAINT `EventPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_contributorId_fkey` FOREIGN KEY (`contributorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherRedemption` ADD CONSTRAINT `VoucherRedemption_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherRedemption` ADD CONSTRAINT `VoucherRedemption_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherRedemption` ADD CONSTRAINT `VoucherRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherRedemption` ADD CONSTRAINT `VoucherRedemption_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


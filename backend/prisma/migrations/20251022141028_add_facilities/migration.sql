-- CreateTable
CREATE TABLE `facility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `openingHours` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `facility_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facility_image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facilityId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL DEFAULT '',
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `facility_image_facilityId_idx`(`facilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facility_video` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facilityId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL DEFAULT '',
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `facility_video_facilityId_idx`(`facilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `facility_image` ADD CONSTRAINT `facility_image_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `facility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facility_video` ADD CONSTRAINT `facility_video_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `facility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `reference` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the `guest_service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `guest_service` DROP FOREIGN KEY `guest_service_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `payment_serviceId_fkey`;

-- DropIndex
DROP INDEX `payment_serviceId_idx` ON `payment`;

-- AlterTable
ALTER TABLE `payment` DROP COLUMN `reference`,
    DROP COLUMN `serviceId`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `room` ADD COLUMN `roomTypeId` INTEGER NULL;

-- DropTable
DROP TABLE `guest_service`;

-- CreateTable
CREATE TABLE `room_type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `room_type_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `extra_service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DOUBLE NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_extra_service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `extraServiceId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_extra_service_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_roomTypeId_fkey` FOREIGN KEY (`roomTypeId`) REFERENCES `room_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_extra_service` ADD CONSTRAINT `booking_extra_service_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_extra_service` ADD CONSTRAINT `booking_extra_service_extraServiceId_fkey` FOREIGN KEY (`extraServiceId`) REFERENCES `extra_service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

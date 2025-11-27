/*
  Warnings:

  - You are about to drop the column `description` on the `service_category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `room_type` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `basePrice` to the `booking_extra_service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `room_type` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `extra_service` DROP FOREIGN KEY `extra_service_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `payment_bookingId_fkey`;

-- AlterTable
ALTER TABLE `booking_extra_service` ADD COLUMN `basePrice` DOUBLE NOT NULL,
    ADD COLUMN `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `serviceChargeAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `extra_service` ADD COLUMN `discountAllowed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `discountPercentage` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `categoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `serviceOrderId` INTEGER NULL,
    MODIFY `bookingId` INTEGER NULL;

-- AlterTable
ALTER TABLE `room_type` ADD COLUMN `code` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `service_category` DROP COLUMN `description`;

-- CreateTable
CREATE TABLE `service_order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guestId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_order_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceOrderId` INTEGER NOT NULL,
    `extraServiceId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `room_type_code_key` ON `room_type`(`code`);

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `service_order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order` ADD CONSTRAINT `service_order_guestId_fkey` FOREIGN KEY (`guestId`) REFERENCES `guest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_item` ADD CONSTRAINT `service_order_item_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `service_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_order_item` ADD CONSTRAINT `service_order_item_extraServiceId_fkey` FOREIGN KEY (`extraServiceId`) REFERENCES `extra_service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `extra_service` ADD CONSTRAINT `extra_service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `service_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `category` on the `extra_service` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `extra_service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `extra_service` DROP COLUMN `category`,
    ADD COLUMN `categoryId` INTEGER NOT NULL,
    ADD COLUMN `image` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `service_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `extra_service` ADD CONSTRAINT `extra_service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `service_category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

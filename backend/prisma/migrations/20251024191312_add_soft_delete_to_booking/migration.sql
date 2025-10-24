/*
  Warnings:

  - A unique constraint covering the columns `[contact]` on the table `housekeeper` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `booking` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `housekeeper_contact_key` ON `housekeeper`(`contact`);

/*
  Warnings:

  - You are about to drop the column `pin` on the `front_office_staff` table. All the data in the column will be lost.
  - You are about to drop the column `accessCode` on the `housekeeper` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `front_office_staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `housekeeper` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `front_office_staff` DROP COLUMN `pin`,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `housekeeper` DROP COLUMN `accessCode`,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `front_office_staff_email_key` ON `front_office_staff`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `housekeeper_email_key` ON `housekeeper`(`email`);

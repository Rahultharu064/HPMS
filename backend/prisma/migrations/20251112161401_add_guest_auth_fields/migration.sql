/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `guest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `guest` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `guest_email_key` ON `guest`(`email`);

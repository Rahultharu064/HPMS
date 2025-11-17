/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `guest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `guest` ADD COLUMN `googleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `guest_googleId_key` ON `guest`(`googleId`);

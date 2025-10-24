/*
  Warnings:

  - You are about to drop the column `role` on the `housekeeper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `housekeeper` DROP COLUMN `role`,
    ADD COLUMN `shift` VARCHAR(191) NOT NULL DEFAULT 'MORNING';

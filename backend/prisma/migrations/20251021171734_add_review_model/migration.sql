/*
  Warnings:

  - You are about to drop the `amenity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `amenity` DROP FOREIGN KEY `Amenity_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_guestId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `image` DROP FOREIGN KEY `Image_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `review_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `video` DROP FOREIGN KEY `Video_roomId_fkey`;

-- DropTable
DROP TABLE `amenity`;

-- DropTable
DROP TABLE `booking`;

-- DropTable
DROP TABLE `guest`;

-- DropTable
DROP TABLE `image`;

-- DropTable
DROP TABLE `payment`;

-- DropTable
DROP TABLE `room`;

-- DropTable
DROP TABLE `video`;

-- RenameIndex
ALTER TABLE `review` RENAME INDEX `review_roomId_fkey` TO `review_roomId_idx`;

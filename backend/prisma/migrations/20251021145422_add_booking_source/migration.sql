-- AlterTable
ALTER TABLE `booking` ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'offline';

-- AlterTable
ALTER TABLE `guest` ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `modeOfArrival` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `booking` ADD COLUMN `discountPercentage` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `serviceChargePercentage` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `taxPercentage` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `guest` ADD COLUMN `verificationTokenExpiry` DATETIME(3) NULL;

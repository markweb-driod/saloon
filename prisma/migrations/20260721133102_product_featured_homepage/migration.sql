-- AlterTable
ALTER TABLE `product` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `homepagePosition` INTEGER NOT NULL DEFAULT 0;

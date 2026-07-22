-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `refundedAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `splitCardAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `splitCashAmount` DECIMAL(10, 2) NULL;

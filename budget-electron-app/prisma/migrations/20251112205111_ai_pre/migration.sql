-- AlterTable
ALTER TABLE `spending_requests` ADD COLUMN `aiConfidence` DECIMAL(3, 2) NULL,
    ADD COLUMN `aiPreApprovalReasoning` TEXT NULL,
    ADD COLUMN `aiPreApprovalRecommendation` VARCHAR(191) NULL,
    ADD COLUMN `aiWarnings` TEXT NULL;

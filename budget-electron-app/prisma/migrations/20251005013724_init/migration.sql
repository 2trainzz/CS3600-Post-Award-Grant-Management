-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `department` VARCHAR(191) NOT NULL DEFAULT 'computer science',

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grantNumber` VARCHAR(191) NOT NULL,
    `grantName` VARCHAR(191) NOT NULL,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `remainingAmount` DECIMAL(15, 2) NOT NULL,
    `studentBalance` DECIMAL(15, 2) NOT NULL,
    `travelBalance` DECIMAL(15, 2) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grants_grantNumber_key`(`grantNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spending_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `requestDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewDate` DATETIME(3) NULL,
    `reviewedBy` INTEGER NULL,
    `reviewNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `spending_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ruleType` VARCHAR(191) NOT NULL,
    `policyHolder` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fringe_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_grants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `grantId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_grants_userId_grantId_key`(`userId`, `grantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_grant_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `grantId` INTEGER NOT NULL,
    `spendingRequestId` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_grant_requests_userId_idx`(`userId`),
    INDEX `user_grant_requests_grantId_idx`(`grantId`),
    INDEX `user_grant_requests_spendingRequestId_idx`(`spendingRequestId`),
    UNIQUE INDEX `user_grant_requests_userId_grantId_spendingRequestId_key`(`userId`, `grantId`, `spendingRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_rule_fringes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spendingRequestId` INTEGER NOT NULL,
    `ruleId` INTEGER NOT NULL,
    `fringeRateId` INTEGER NOT NULL,
    `appliedAmount` DECIMAL(15, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `request_rule_fringes_spendingRequestId_idx`(`spendingRequestId`),
    INDEX `request_rule_fringes_ruleId_idx`(`ruleId`),
    INDEX `request_rule_fringes_fringeRateId_idx`(`fringeRateId`),
    UNIQUE INDEX `request_rule_fringes_spendingRequestId_ruleId_fringeRateId_key`(`spendingRequestId`, `ruleId`, `fringeRateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_grants` ADD CONSTRAINT `user_grants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_grants` ADD CONSTRAINT `user_grants_grantId_fkey` FOREIGN KEY (`grantId`) REFERENCES `grants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_grant_requests` ADD CONSTRAINT `user_grant_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_grant_requests` ADD CONSTRAINT `user_grant_requests_grantId_fkey` FOREIGN KEY (`grantId`) REFERENCES `grants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_grant_requests` ADD CONSTRAINT `user_grant_requests_spendingRequestId_fkey` FOREIGN KEY (`spendingRequestId`) REFERENCES `spending_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_rule_fringes` ADD CONSTRAINT `request_rule_fringes_spendingRequestId_fkey` FOREIGN KEY (`spendingRequestId`) REFERENCES `spending_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_rule_fringes` ADD CONSTRAINT `request_rule_fringes_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_rule_fringes` ADD CONSTRAINT `request_rule_fringes_fringeRateId_fkey` FOREIGN KEY (`fringeRateId`) REFERENCES `fringe_rates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

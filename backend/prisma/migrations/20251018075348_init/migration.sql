-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user_kyc` ADD COLUMN `kyc_rejection_reason` VARCHAR(191) NULL DEFAULT '';

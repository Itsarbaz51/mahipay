/*
  Warnings:

  - You are about to drop the column `business_kyc_id` on the `pii_consents` table. All the data in the column will be lost.
  - You are about to drop the column `businessKyc_id` on the `user_kyc` table. All the data in the column will be lost.
  - You are about to drop the `api_key_ip_whitelists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `api_key_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `business_kycs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `api_key_ip_whitelists` DROP FOREIGN KEY `api_key_ip_whitelists_apiKeyId_fkey`;

-- DropForeignKey
ALTER TABLE `api_key_services` DROP FOREIGN KEY `api_key_services_apiKeyId_fkey`;

-- DropForeignKey
ALTER TABLE `api_key_services` DROP FOREIGN KEY `api_key_services_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `api_keys` DROP FOREIGN KEY `api_keys_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `business_kycs` DROP FOREIGN KEY `business_kycs_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `business_kycs` DROP FOREIGN KEY `business_kycs_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `pii_consents` DROP FOREIGN KEY `pii_consents_business_kyc_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_kyc` DROP FOREIGN KEY `user_kyc_businessKyc_id_fkey`;

-- DropIndex
DROP INDEX `pii_consents_business_kyc_id_fkey` ON `pii_consents`;

-- DropIndex
DROP INDEX `user_kyc_businessKyc_id_fkey` ON `user_kyc`;

-- AlterTable
ALTER TABLE `pii_consents` DROP COLUMN `business_kyc_id`;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user_kyc` DROP COLUMN `businessKyc_id`;

-- DropTable
DROP TABLE `api_key_ip_whitelists`;

-- DropTable
DROP TABLE `api_key_services`;

-- DropTable
DROP TABLE `api_keys`;

-- DropTable
DROP TABLE `business_kycs`;

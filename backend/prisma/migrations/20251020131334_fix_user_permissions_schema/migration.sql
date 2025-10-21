/*
  Warnings:

  - You are about to drop the column `service_id` on the `user_permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user_permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `service_ids` to the `user_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_permissions` DROP FOREIGN KEY `user_permissions_service_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_permissions` DROP FOREIGN KEY `user_permissions_user_id_fkey`;

-- DropIndex
DROP INDEX `user_permissions_service_id_fkey` ON `user_permissions`;

-- DropIndex
DROP INDEX `user_permissions_user_id_service_id_key` ON `user_permissions`;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user_permissions` DROP COLUMN `service_id`,
    ADD COLUMN `serviceId` VARCHAR(191) NULL,
    ADD COLUMN `service_ids` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_permissions_user_id_key` ON `user_permissions`(`user_id`);

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_collections` ADD CONSTRAINT `cc_collections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

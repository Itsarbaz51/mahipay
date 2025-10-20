-- DropIndex
DROP INDEX `users_refresh_token_key` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `refresh_token` TEXT NULL;

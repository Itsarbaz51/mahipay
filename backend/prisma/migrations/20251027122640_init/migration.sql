-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `description` LONGTEXT NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    UNIQUE INDEX `roles_level_key`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` TEXT NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `profile_image` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `transaction_pin` TEXT NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `hierarchy_level` INTEGER NOT NULL,
    `hierarchy_path` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'IN_ACTIVE', 'DELETE') NOT NULL DEFAULT 'ACTIVE',
    `is_kyc_verified` BOOLEAN NOT NULL DEFAULT false,
    `role_id` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `password_reset_token` VARCHAR(191) NULL,
    `password_reset_expires` DATETIME(3) NULL,
    `email_verification_token` VARCHAR(191) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `email_verification_token_expires` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    INDEX `users_parent_id_idx`(`parent_id`),
    INDEX `users_hierarchy_level_idx`(`hierarchy_level`),
    INDEX `users_phone_number_idx`(`phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_entities` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `provider` ENUM('BULKPE', 'PAYTM', 'RAZORPAY', 'CCAVENUE', 'BILLDESK', 'AIRTEL', 'JIO', 'OTHER') NOT NULL DEFAULT 'BULKPE',
    `provider_data` JSON NULL,
    `metadata` JSON NULL,
    `verification_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `verified_at` DATETIME(3) NULL,

    UNIQUE INDEX `api_entities_entity_id_key`(`entity_id`),
    UNIQUE INDEX `api_entities_reference_key`(`reference`),
    INDEX `api_entities_user_id_service_id_idx`(`user_id`, `service_id`),
    INDEX `api_entities_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `api_entities_reference_idx`(`reference`),
    INDEX `api_entities_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_webhooks` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NULL,
    `api_entity_id` VARCHAR(191) NULL,
    `provider` ENUM('BULKPE', 'PAYTM', 'RAZORPAY', 'CCAVENUE', 'BILLDESK', 'AIRTEL', 'JIO', 'OTHER') NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `signature` VARCHAR(191) NULL,
    `headers` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_attempt_at` DATETIME(3) NULL,
    `response` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `api_webhooks_transaction_id_idx`(`transaction_id`),
    INDEX `api_webhooks_api_entity_id_idx`(`api_entity_id`),
    INDEX `api_webhooks_provider_event_type_idx`(`provider`, `event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_kyc` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `father_name` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECT') NOT NULL DEFAULT 'PENDING',
    `type` ENUM('AEPS', 'USER_KYC') NOT NULL DEFAULT 'USER_KYC',
    `kyc_rejection_reason` LONGTEXT NULL,
    `address_id` VARCHAR(191) NOT NULL,
    `pan_file` VARCHAR(191) NOT NULL,
    `aadhaar_file` VARCHAR(191) NOT NULL,
    `address_proof_file` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_details` (
    `id` VARCHAR(191) NOT NULL,
    `account_holder` TEXT NOT NULL,
    `account_number` VARCHAR(18) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `account_type` ENUM('PERSONAL', 'BUSINESS') NOT NULL,
    `ifsc_code` TEXT NOT NULL,
    `bank_name` TEXT NOT NULL,
    `bank_proof_file` VARCHAR(191) NOT NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `bank_details_account_number_key`(`account_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banks` (
    `id` VARCHAR(191) NOT NULL,
    `bank_name` TEXT NOT NULL,
    `ifsc_code` TEXT NOT NULL,
    `bank_icon` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `states` (
    `id` VARCHAR(191) NOT NULL,
    `state_name` VARCHAR(191) NOT NULL,
    `state_code` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `states_state_code_key`(`state_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` VARCHAR(191) NOT NULL,
    `city_name` VARCHAR(191) NOT NULL,
    `city_code` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cities_city_code_key`(`city_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(191) NOT NULL,
    `address` LONGTEXT NOT NULL,
    `pin_code` VARCHAR(191) NOT NULL,
    `state_id` VARCHAR(191) NOT NULL,
    `city_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `balance` BIGINT NOT NULL DEFAULT 0,
    `currency` ENUM('INR', 'USD', 'EUR', 'GBP', 'AED') NOT NULL DEFAULT 'INR',
    `wallet_type` ENUM('PRIMARY', 'COMMISSION', 'ESCROW', 'TAX', 'BONUS', 'HOLDING') NOT NULL DEFAULT 'PRIMARY',
    `hold_balance` BIGINT NOT NULL DEFAULT 0,
    `available_balance` BIGINT NOT NULL DEFAULT 0,
    `daily_limit` BIGINT NULL,
    `monthly_limit` BIGINT NULL,
    `per_transaction_limit` BIGINT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `wallets_user_id_is_active_idx`(`user_id`, `is_active`),
    UNIQUE INDEX `wallets_user_id_wallet_type_key`(`user_id`, `wallet_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_settings` (
    `id` VARCHAR(191) NOT NULL,
    `scope` ENUM('ROLE', 'USER') NOT NULL DEFAULT 'ROLE',
    `role_id` VARCHAR(191) NULL,
    `target_user_id` VARCHAR(191) NULL,
    `service_id` VARCHAR(191) NULL,
    `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL,
    `commission_value` DECIMAL(12, 4) NOT NULL,
    `min_amount` BIGINT NULL,
    `max_amount` BIGINT NULL,
    `applyTDS` BOOLEAN NOT NULL DEFAULT false,
    `tds_percent` DECIMAL(5, 2) NULL,
    `applyGST` BOOLEAN NOT NULL DEFAULT false,
    `gst_percent` DECIMAL(5, 2) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commission_settings_scope_role_id_target_user_id_idx`(`scope`, `role_id`, `target_user_id`),
    INDEX `commission_settings_is_active_effectiveFrom_effectiveTo_idx`(`is_active`, `effectiveFrom`, `effectiveTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_earnings` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `from_user_id` VARCHAR(191) NULL,
    `amount` BIGINT NOT NULL,
    `commission_amount` BIGINT NOT NULL,
    `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL,
    `tds_amount` BIGINT NULL,
    `gst_amount` BIGINT NULL,
    `net_amount` BIGINT NOT NULL,
    `metadata` JSON NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `serviceId` VARCHAR(191) NULL,

    INDEX `commission_earnings_transaction_id_user_id_idx`(`transaction_id`, `user_id`),
    INDEX `commission_earnings_created_at_idx`(`created_at`),
    INDEX `commission_earnings_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_providers` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `config` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `service_providers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `module_types` VARCHAR(191) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_set_commission` BOOLEAN NOT NULL DEFAULT false,
    `can_process` BOOLEAN NOT NULL DEFAULT false,
    `limits` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_permissions_user_id_service_id_key`(`user_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `module_types` VARCHAR(191) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_set_commission` BOOLEAN NOT NULL DEFAULT false,
    `can_process` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permissions_role_id_service_id_key`(`role_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `company_name` VARCHAR(191) NOT NULL,
    `company_logo` VARCHAR(191) NOT NULL,
    `fav_icon` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `whtsapp_number` VARCHAR(191) NOT NULL,
    `company_email` VARCHAR(191) NOT NULL,
    `facebook_url` VARCHAR(191) NOT NULL,
    `instagram_url` VARCHAR(191) NOT NULL,
    `twitter_url` VARCHAR(191) NOT NULL,
    `linkedin_url` VARCHAR(191) NOT NULL,
    `website_url` VARCHAR(191) NOT NULL,
    `settings` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `domain_name` VARCHAR(191) NOT NULL,
    `ip_address` VARCHAR(191) NOT NULL,
    `user_agent` VARCHAR(191) NULL,
    `location` LONGTEXT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_logs_user_id_idx`(`user_id`),
    INDEX `login_logs_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `external_ref_id` VARCHAR(191) NULL,
    `idempotency_key` VARCHAR(191) NULL,
    `amount` BIGINT NOT NULL,
    `currency` ENUM('INR', 'USD', 'EUR', 'GBP', 'AED') NOT NULL DEFAULT 'INR',
    `netAmount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `service_id` VARCHAR(191) NULL,
    `payment_type` ENUM('COLLECTION', 'PAYOUT', 'REFUND', 'REVERSAL', 'COMMISSION', 'FEE', 'TAX', 'ADJUSTMENT', 'CHARGE', 'FUND_REQ_BANK', 'FUND_REQ_RAZORPAY') NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `wallet_id` VARCHAR(191) NOT NULL,
    `api_entity_id` VARCHAR(191) NULL,
    `providerCharge` BIGINT NULL,
    `commissionAmount` BIGINT NULL,
    `tax_amount` BIGINT NULL,
    `fee_amount` BIGINT NULL,
    `cashback_amount` BIGINT NULL,
    `provider_reference` VARCHAR(191) NULL,
    `provider_response` JSON NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `metadata` JSON NULL,
    `initiated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transactions_user_id_status_idx`(`user_id`, `status`),
    INDEX `transactions_idempotency_key_idx`(`idempotency_key`),
    INDEX `transactions_service_id_createdAt_idx`(`service_id`, `createdAt`),
    INDEX `transactions_external_ref_id_idx`(`external_ref_id`),
    INDEX `transactions_provider_reference_idx`(`provider_reference`),
    INDEX `transactions_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NULL,
    `wallet_id` VARCHAR(191) NOT NULL,
    `entry_type` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `reference_type` ENUM('TRANSACTION', 'COMMISSION', 'REFUND', 'ADJUSTMENT', 'BONUS', 'CHARGE', 'FEE', 'TAX', 'PAYOUT', 'COLLECTION') NOT NULL,
    `service_id` VARCHAR(191) NULL,
    `amount` BIGINT NOT NULL,
    `running_balance` BIGINT NOT NULL,
    `narration` TEXT NOT NULL,
    `metadata` JSON NULL,
    `idempotency_key` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ledger_entries_transaction_id_idx`(`transaction_id`),
    INDEX `ledger_entries_wallet_id_created_at_idx`(`wallet_id`, `created_at`),
    INDEX `ledger_entries_service_id_reference_type_idx`(`service_id`, `reference_type`),
    INDEX `ledger_entries_idempotency_key_idx`(`idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotency_keys` (
    `key` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expired_at` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `meta` JSON NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `initiated_by` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pii_consents` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `user_kyc_id` VARCHAR(191) NULL,
    `piiType` VARCHAR(191) NOT NULL,
    `piiHash` VARCHAR(191) NOT NULL,
    `providedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pii_consents_user_id_piiType_scope_key`(`user_id`, `piiType`, `scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_entities` ADD CONSTRAINT `api_entities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_entities` ADD CONSTRAINT `api_entities_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_webhooks` ADD CONSTRAINT `api_webhooks_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_webhooks` ADD CONSTRAINT `api_webhooks_api_entity_id_fkey` FOREIGN KEY (`api_entity_id`) REFERENCES `api_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_details` ADD CONSTRAINT `bank_details_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_providers` ADD CONSTRAINT `service_providers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `login_logs` ADD CONSTRAINT `login_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_api_entity_id_fkey` FOREIGN KEY (`api_entity_id`) REFERENCES `api_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_kyc_id_fkey` FOREIGN KEY (`user_kyc_id`) REFERENCES `user_kyc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

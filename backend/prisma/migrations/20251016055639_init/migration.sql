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
    `wallet_balance` BIGINT NULL DEFAULT 0,
    `is_authorized` BOOLEAN NOT NULL DEFAULT false,
    `parent_id` VARCHAR(191) NULL,
    `hierarchy_level` INTEGER NOT NULL,
    `hierarchy_path` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'IN_ACTIVE', 'DELETE') NOT NULL DEFAULT 'ACTIVE',
    `is_kyc_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `refresh_token` VARCHAR(191) NULL,
    `password_reset_token` VARCHAR(191) NULL,
    `password_reset_expires` DATETIME(3) NULL,
    `email_verification_token` VARCHAR(191) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `email_verification_token_expires` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    UNIQUE INDEX `users_refresh_token_key`(`refresh_token`),
    INDEX `users_parent_id_idx`(`parent_id`),
    INDEX `users_hierarchy_level_idx`(`hierarchy_level`),
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
    `address_id` VARCHAR(191) NOT NULL,
    `pan_file` VARCHAR(191) NOT NULL,
    `aadhaar_file` VARCHAR(191) NOT NULL,
    `address_proof_file` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `businessKyc_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_kycs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `business_name` TEXT NOT NULL,
    `business_type` ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED') NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECT') NOT NULL DEFAULT 'PENDING',
    `address_id` VARCHAR(191) NOT NULL,
    `pan_file` VARCHAR(191) NOT NULL,
    `gst_file` VARCHAR(191) NOT NULL,
    `udhyam_aadhar` VARCHAR(191) NULL,
    `br_doc` VARCHAR(191) NULL,
    `partnership_deed` VARCHAR(191) NULL,
    `partner_kyc_numbers` INTEGER NULL,
    `cin` VARCHAR(191) NULL,
    `moa_file` VARCHAR(191) NULL,
    `aoa_file` VARCHAR(191) NULL,
    `director_kyc_numbers` INTEGER NULL DEFAULT 2,
    `director_shareholding_file` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `business_kycs_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_details` (
    `id` VARCHAR(191) NOT NULL,
    `account_holder` TEXT NOT NULL,
    `account_number` VARCHAR(18) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `account_type` ENUM('PERSONAL', 'BUSINESS') NOT NULL,
    `bank_proof_file` VARCHAR(191) NOT NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `user_id` VARCHAR(191) NOT NULL,
    `bank_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

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
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` VARCHAR(191) NOT NULL,
    `city_name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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
    `isPrimary` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `wallets_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_settings` (
    `id` VARCHAR(191) NOT NULL,
    `scope` ENUM('ROLE', 'USER') NOT NULL DEFAULT 'ROLE',
    `role_id` VARCHAR(191) NULL,
    `target_user_id` VARCHAR(191) NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL,
    `commission_value` DECIMAL(12, 4) NOT NULL,
    `min_amount` BIGINT NULL,
    `max_amount` BIGINT NULL,
    `applyTDS` BOOLEAN NOT NULL DEFAULT false,
    `tds_percent` DECIMAL(5, 2) NULL,
    `applyGST` BOOLEAN NOT NULL DEFAULT false,
    `gst_percent` DECIMAL(5, 2) NULL,
    `channel` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commission_settings_scope_role_id_target_user_id_service_id__idx`(`scope`, `role_id`, `target_user_id`, `service_id`, `channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_earnings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `from_user_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(100) NOT NULL,
    `amount` BIGINT NOT NULL,
    `commission_amount` BIGINT NOT NULL,
    `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL,
    `level` INTEGER NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commission_earnings_transaction_id_user_id_idx`(`transaction_id`, `user_id`),
    INDEX `commission_earnings_service_id_created_at_idx`(`service_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'IN_ACTIVE', 'UNAVAILABLE') NOT NULL DEFAULT 'ACTIVE',
    `icon` VARCHAR(191) NULL,
    `description` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_name_key`(`name`),
    UNIQUE INDEX `services_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_providers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_providers_name_key`(`name`),
    UNIQUE INDEX `service_providers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `api_keys_key_key`(`key`),
    INDEX `api_keys_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_key_services` (
    `id` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `rateLimit` INTEGER NULL,
    `callbackUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `api_key_services_apiKeyId_serviceId_key`(`apiKeyId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_key_ip_whitelists` (
    `id` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `api_key_ip_whitelists_apiKeyId_idx`(`apiKeyId`),
    UNIQUE INDEX `api_key_ip_whitelists_apiKeyId_ip_key`(`apiKeyId`, `ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provider_credentials` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `env` ENUM('PROD', 'STAGING') NOT NULL,
    `keyName` VARCHAR(191) NOT NULL,
    `keyVaultRef` VARCHAR(191) NOT NULL,
    `meta` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `provider_credentials_providerId_env_key`(`providerId`, `env`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provider_ratecards` (
    `id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `fixedCharge` BIGINT NULL,
    `percentCharge` DOUBLE NULL,
    `minCharge` BIGINT NULL,
    `maxCharge` BIGINT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `provider_ratecards_provider_id_service_id_effectiveFrom_key`(`provider_id`, `service_id`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_set_commission` BOOLEAN NOT NULL DEFAULT false,
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
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_set_commission` BOOLEAN NOT NULL DEFAULT false,
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
    `user_id` VARCHAR(191) NOT NULL,
    `wallet_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NULL,
    `amount` BIGINT NOT NULL,
    `providerCharge` BIGINT NULL,
    `commissionAmount` BIGINT NOT NULL,
    `netAmount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `rateLimit` INTEGER NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `completed_at` DATETIME(3) NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transactions_user_id_idx`(`user_id`),
    INDEX `transactions_idempotency_key_idx`(`idempotency_key`),
    INDEX `transactions_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `transactions_service_id_createdAt_idx`(`service_id`, `createdAt`),
    INDEX `transactions_external_ref_id_idx`(`external_ref_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NULL,
    `wallet_id` VARCHAR(191) NULL,
    `entry_type` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `reference_type` ENUM('TRANSACTION', 'COMMISSION', 'REFUND', 'ADJUSTMENT', 'BONUS', 'CHARGE') NULL,
    `amount` BIGINT NOT NULL,
    `running_balance` BIGINT NOT NULL,
    `narration` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `idempotency_key` VARCHAR(191) NULL,

    INDEX `ledger_entries_transaction_id_idx`(`transaction_id`),
    INDEX `ledger_entries_wallet_id_created_at_idx`(`wallet_id`, `created_at`),
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
    `business_kyc_id` VARCHAR(191) NULL,
    `piiType` VARCHAR(191) NOT NULL,
    `piiHash` VARCHAR(191) NOT NULL,
    `providedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pii_consents_user_id_piiType_scope_key`(`user_id`, `piiType`, `scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cc_senders` (
    `id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `reference_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_in_pan` VARCHAR(191) NOT NULL,
    `pan` VARCHAR(191) NOT NULL,
    `aadhar` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `card_no` VARCHAR(16) NOT NULL,
    `cvv` VARCHAR(3) NOT NULL,
    `expiry` VARCHAR(7) NOT NULL,
    `card_front_image` TEXT NULL,
    `card_back_image` TEXT NULL,
    `card_type` ENUM('VISA', 'RUPAY', 'MASTER') NOT NULL,
    `charge` DECIMAL(10, 2) NULL,
    `gst` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED') NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `cc_senders_sender_id_key`(`sender_id`),
    UNIQUE INDEX `cc_senders_reference_id_key`(`reference_id`),
    INDEX `cc_senders_user_id_idx`(`user_id`),
    INDEX `cc_senders_reference_id_idx`(`reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cc_beneficiaries` (
    `id` VARCHAR(191) NOT NULL,
    `beneficiary_id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `account_holder_name` VARCHAR(191) NULL,
    `account_number` VARCHAR(191) NOT NULL,
    `ifsc` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'FAILED', 'SUCCESS') NOT NULL DEFAULT 'PENDING',
    `message` TEXT NULL,

    UNIQUE INDEX `cc_beneficiaries_beneficiary_id_key`(`beneficiary_id`),
    UNIQUE INDEX `cc_beneficiaries_reference_key`(`reference`),
    INDEX `cc_beneficiaries_user_id_idx`(`user_id`),
    INDEX `cc_beneficiaries_reference_idx`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cc_collections` (
    `id` VARCHAR(191) NOT NULL,
    `collection_id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `beneficiaryId` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `type` ENUM('INSTANT', 'T_PLUS_1') NOT NULL,
    `redirect_url` TEXT NOT NULL,
    `card_type` ENUM('VISA', 'RUPAY', 'MASTER') NOT NULL,
    `additional_charge` DECIMAL(10, 2) NULL,
    `collection_url` TEXT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'PROCESSING', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `message` TEXT NULL,
    `utr` VARCHAR(191) NULL,
    `charge` DECIMAL(10, 2) NULL,
    `gst` DECIMAL(10, 2) NULL,

    UNIQUE INDEX `cc_collections_collection_id_key`(`collection_id`),
    UNIQUE INDEX `cc_collections_reference_key`(`reference`),
    INDEX `cc_collections_user_id_idx`(`user_id`),
    INDEX `cc_collections_reference_idx`(`reference`),
    INDEX `cc_collections_collection_id_idx`(`collection_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cc_payouts` (
    `id` VARCHAR(191) NOT NULL,
    `collection_id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `account_number` VARCHAR(191) NOT NULL,
    `ifsc` VARCHAR(191) NOT NULL,
    `beneficiary_name` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `payment_mode` VARCHAR(191) NOT NULL DEFAULT 'IMPS',
    `utr` VARCHAR(191) NULL,
    `holder_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cc_payouts_collection_id_idx`(`collection_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_businessKyc_id_fkey` FOREIGN KEY (`businessKyc_id`) REFERENCES `business_kycs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_kycs` ADD CONSTRAINT `business_kycs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_kycs` ADD CONSTRAINT `business_kycs_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_details` ADD CONSTRAINT `bank_details_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_details` ADD CONSTRAINT `bank_details_bank_id_fkey` FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_settings` ADD CONSTRAINT `commission_settings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_earnings` ADD CONSTRAINT `commission_earnings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_key_services` ADD CONSTRAINT `api_key_services_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_key_services` ADD CONSTRAINT `api_key_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_key_ip_whitelists` ADD CONSTRAINT `api_key_ip_whitelists_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_credentials` ADD CONSTRAINT `provider_credentials_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `service_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_ratecards` ADD CONSTRAINT `provider_ratecards_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_ratecards` ADD CONSTRAINT `provider_ratecards_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `login_logs` ADD CONSTRAINT `login_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `service_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_kyc_id_fkey` FOREIGN KEY (`user_kyc_id`) REFERENCES `user_kyc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_business_kyc_id_fkey` FOREIGN KEY (`business_kyc_id`) REFERENCES `business_kycs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_senders` ADD CONSTRAINT `cc_senders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_beneficiaries` ADD CONSTRAINT `cc_beneficiaries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_collections` ADD CONSTRAINT `cc_collections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_collections` ADD CONSTRAINT `cc_collections_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `cc_senders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_collections` ADD CONSTRAINT `cc_collections_beneficiaryId_fkey` FOREIGN KEY (`beneficiaryId`) REFERENCES `cc_beneficiaries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cc_payouts` ADD CONSTRAINT `cc_payouts_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `cc_collections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

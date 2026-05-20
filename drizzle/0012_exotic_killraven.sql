CREATE TABLE `billing_contact_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact_name` varchar(255) DEFAULT '',
	`contact_phone` varchar(64) DEFAULT '',
	`contact_email` varchar(255) DEFAULT '',
	`updated_by` varchar(36),
	`updated_at` datetime NOT NULL,
	CONSTRAINT `billing_contact_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_plans` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`max_companies` int NOT NULL,
	`max_scans` int NOT NULL,
	`storage` varchar(128) NOT NULL,
	`ai_magic` varchar(255),
	`cheque_handling` varchar(255),
	`badge` varchar(128),
	`badge_color` varchar(128),
	`features` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `billing_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_bank_accounts` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`bank_name` varchar(128) NOT NULL,
	`nickname` varchar(64) NOT NULL,
	`account_type` enum('checking','savings') NOT NULL,
	`account_last4` varchar(4) NOT NULL,
	`account_number_enc` varbinary(512) NOT NULL,
	`key_version` int NOT NULL DEFAULT 1,
	`account_number_hash` varchar(64) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`deleted_at` datetime,
	CONSTRAINT `client_bank_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cba_client_hash_uq` UNIQUE(`client_id`,`account_number_hash`)
);
--> statement-breakpoint
CREATE TABLE `client_notification_preferences` (
	`client_id` varchar(36) NOT NULL,
	`email_enabled` boolean NOT NULL DEFAULT true,
	`new_mail_scanned` boolean NOT NULL DEFAULT true,
	`new_cheque_scanned` boolean NOT NULL DEFAULT true,
	`delivery_updates` boolean NOT NULL DEFAULT true,
	`deposit_updates` boolean NOT NULL DEFAULT false,
	`weekly_summary` boolean NOT NULL DEFAULT true,
	`updated_by` varchar(36),
	`updated_at` datetime NOT NULL,
	CONSTRAINT `client_notification_preferences_client_id` PRIMARY KEY(`client_id`)
);
--> statement-breakpoint
CREATE TABLE `customer_hidden_records` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`record_id` varchar(36) NOT NULL,
	`hidden_at` datetime NOT NULL,
	CONSTRAINT `customer_hidden_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `chr_client_record_uq` UNIQUE(`client_id`,`record_id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_addresses` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`label` varchar(64) NOT NULL,
	`recipient_name` varchar(128) NOT NULL,
	`line1` varchar(255) NOT NULL,
	`line2` varchar(255),
	`city` varchar(128) NOT NULL,
	`state` varchar(32) NOT NULL,
	`zip` varchar(32) NOT NULL,
	`country` varchar(2) NOT NULL DEFAULT 'US',
	`phone` varchar(32),
	`email` varchar(255),
	`is_default` boolean NOT NULL DEFAULT false,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`deleted_at` datetime,
	CONSTRAINT `delivery_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manual_payments` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`recorded_by` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`payment_method` enum('cash','bank_transfer','cheque','other') NOT NULL DEFAULT 'other',
	`reference_no` varchar(255),
	`receipt_url` varchar(500),
	`notes` text,
	`payment_date` date NOT NULL,
	`period_covered` enum('monthly','quarterly','annual','custom') NOT NULL DEFAULT 'monthly',
	`duration_months` int NOT NULL DEFAULT 1,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `manual_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `pr_token_uq` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `recovery_codes` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	`used_at` datetime,
	CONSTRAINT `recovery_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `cheques`;--> statement-breakpoint
DROP TABLE `company_directory`;--> statement-breakpoint
DROP TABLE `deposit_batches`;--> statement-breakpoint
DROP TABLE `mail_items`;--> statement-breakpoint
DROP TABLE `manually_added_clients`;--> statement-breakpoint
ALTER TABLE `clients` DROP INDEX `clients_client_code_uq`;--> statement-breakpoint
ALTER TABLE `invoices` DROP INDEX `invoices_stripe_invoice_uq`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP INDEX `subscriptions_stripe_sub_uq`;--> statement-breakpoint
DROP INDEX `audit_logs_actor_idx` ON `audit_logs`;--> statement-breakpoint
DROP INDEX `audit_logs_entity_idx` ON `audit_logs`;--> statement-breakpoint
DROP INDEX `audit_logs_created_at_idx` ON `audit_logs`;--> statement-breakpoint
DROP INDEX `clients_email_idx` ON `clients`;--> statement-breakpoint
DROP INDEX `email_verifications_email_idx` ON `email_verifications`;--> statement-breakpoint
DROP INDEX `invoices_client_idx` ON `invoices`;--> statement-breakpoint
DROP INDEX `subscriptions_client_idx` ON `subscriptions`;--> statement-breakpoint
DROP INDEX `usage_events_client_idx` ON `usage_events`;--> statement-breakpoint
DROP INDEX `usage_events_created_at_idx` ON `usage_events`;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `status` enum('active','suspended','pending','inactive') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `stripe_invoice_id` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `pdf_url` varchar(1000);--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('paid','open','void','uncollectible','draft') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `profiles` MODIFY COLUMN `role` enum('super_admin','admin','client') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `plan_tier` enum('starter','professional','enterprise') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('active','past_due','canceled','trialing','paused','blocked') NOT NULL DEFAULT 'trialing';--> statement-breakpoint
ALTER TABLE `usage_events` MODIFY COLUMN `event_type` enum('scan','ai_analysis','storage','api_call') NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_events` MODIFY COLUMN `quantity` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `usage_events` MODIFY COLUMN `unit_cost` decimal(12,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `usage_events` MODIFY COLUMN `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `actor_role` enum('super_admin','admin','client') NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `client_id` varchar(36);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `before_state` json;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `after_state` json;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `user_agent` varchar(255);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `notif_recipient_id` varchar(36);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `notif_is_read` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `notif_title` varchar(255);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `notif_target_url` varchar(500);--> statement-breakpoint
ALTER TABLE `clients` ADD `table_name` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `website` varchar(500);--> statement-breakpoint
ALTER TABLE `clients` ADD `employees` varchar(32);--> statement-breakpoint
ALTER TABLE `clients` ADD `client_type` enum('subscription','manual') DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `added_by` varchar(36);--> statement-breakpoint
ALTER TABLE `clients` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `suspended_reason` enum('admin','payment_overdue');--> statement-breakpoint
ALTER TABLE `clients` ADD `avatar_url` varchar(500);--> statement-breakpoint
ALTER TABLE `clients` ADD `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `invoices` ADD `invoice_number` varchar(64);--> statement-breakpoint
ALTER TABLE `invoices` ADD `amount_due` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `amount_paid` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `currency` varchar(8) DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `plan_tier` enum('starter','professional','enterprise');--> statement-breakpoint
ALTER TABLE `invoices` ADD `description` varchar(500);--> statement-breakpoint
ALTER TABLE `invoices` ADD `hosted_url` varchar(1000);--> statement-breakpoint
ALTER TABLE `invoices` ADD `period_start` datetime;--> statement-breakpoint
ALTER TABLE `invoices` ADD `period_end` datetime;--> statement-breakpoint
ALTER TABLE `invoices` ADD `paid_at` datetime;--> statement-breakpoint
ALTER TABLE `profiles` ADD `two_fa_secret` varchar(255);--> statement-breakpoint
ALTER TABLE `profiles` ADD `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripe_customer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `monthly_amount` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `canceled_at` datetime;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `grace_period_until` datetime;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `payment_failed_at` datetime;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `failed_payment_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `triggered_by` varchar(36);--> statement-breakpoint
ALTER TABLE `users` ADD `first_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `last_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(10) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `login_alerts_enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `session_timeout` varchar(8) DEFAULT '30' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `backup_email` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `backup_email_verified_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_code_uq` UNIQUE(`client_code`);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_table_name_uq` UNIQUE(`table_name`);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_email_uq` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `inv_stripe_uq` UNIQUE(`stripe_invoice_id`);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `sub_stripe_uq` UNIQUE(`stripe_subscription_id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_backup_email_uq` UNIQUE(`backup_email`);--> statement-breakpoint
CREATE INDEX `cba_client_idx` ON `client_bank_accounts` (`client_id`);--> statement-breakpoint
CREATE INDEX `cba_client_active_idx` ON `client_bank_accounts` (`client_id`,`status`);--> statement-breakpoint
CREATE INDEX `cnp_updated_by_idx` ON `client_notification_preferences` (`updated_by`);--> statement-breakpoint
CREATE INDEX `chr_client_idx` ON `customer_hidden_records` (`client_id`);--> statement-breakpoint
CREATE INDEX `da_client_idx` ON `delivery_addresses` (`client_id`);--> statement-breakpoint
CREATE INDEX `da_client_default_idx` ON `delivery_addresses` (`client_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `mp_client_idx` ON `manual_payments` (`client_id`);--> statement-breakpoint
CREATE INDEX `mp_recorder_idx` ON `manual_payments` (`recorded_by`);--> statement-breakpoint
CREATE INDEX `mp_date_idx` ON `manual_payments` (`payment_date`);--> statement-breakpoint
CREATE INDEX `pr_user_idx` ON `password_resets` (`user_id`);--> statement-breakpoint
CREATE INDEX `rc_user_idx` ON `recovery_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `al_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `al_role_idx` ON `audit_logs` (`actor_role`);--> statement-breakpoint
CREATE INDEX `al_client_idx` ON `audit_logs` (`client_id`);--> statement-breakpoint
CREATE INDEX `al_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `al_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `al_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `al_notif_recipient_idx` ON `audit_logs` (`notif_recipient_id`,`notif_is_read`);--> statement-breakpoint
CREATE INDEX `clients_status_idx` ON `clients` (`status`);--> statement-breakpoint
CREATE INDEX `clients_type_idx` ON `clients` (`client_type`);--> statement-breakpoint
CREATE INDEX `clients_added_by_idx` ON `clients` (`added_by`);--> statement-breakpoint
CREATE INDEX `ev_email_idx` ON `email_verifications` (`email`);--> statement-breakpoint
CREATE INDEX `inv_client_idx` ON `invoices` (`client_id`);--> statement-breakpoint
CREATE INDEX `inv_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `inv_created_idx` ON `invoices` (`created_at`);--> statement-breakpoint
CREATE INDEX `profiles_role_idx` ON `profiles` (`role`);--> statement-breakpoint
CREATE INDEX `sub_client_idx` ON `subscriptions` (`client_id`);--> statement-breakpoint
CREATE INDEX `sub_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `ue_client_idx` ON `usage_events` (`client_id`);--> statement-breakpoint
CREATE INDEX `ue_type_idx` ON `usage_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `ue_created_idx` ON `usage_events` (`created_at`);--> statement-breakpoint
ALTER TABLE `audit_logs` DROP COLUMN `details`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `stripe_customer_id`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `plan_type`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `plan_tier`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `wallet_balance`;--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `amount`;
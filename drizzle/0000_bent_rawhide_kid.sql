CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`actor_id` varchar(36) NOT NULL,
	`action` varchar(128) NOT NULL,
	`entity_type` varchar(64) NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`details` json NOT NULL,
	`ip_address` varchar(64),
	`created_at` datetime NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cheques` (
	`id` varchar(36) NOT NULL,
	`mail_item_id` varchar(36) NOT NULL,
	`amount_figures` decimal(12,2) NOT NULL,
	`amount_words` varchar(255) NOT NULL,
	`amounts_match` boolean NOT NULL DEFAULT false,
	`date_on_cheque` varchar(64) NOT NULL,
	`date_valid` boolean NOT NULL DEFAULT false,
	`beneficiary` varchar(255) NOT NULL,
	`beneficiary_match_score` decimal(6,4) NOT NULL,
	`signature_present` boolean NOT NULL DEFAULT false,
	`alteration_detected` boolean NOT NULL DEFAULT false,
	`crossing_present` boolean NOT NULL DEFAULT false,
	`ai_confidence` decimal(6,4) NOT NULL,
	`ai_raw_result` json NOT NULL,
	`client_decision` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`decided_by` varchar(36),
	`decided_at` datetime,
	`deposit_batch_id` varchar(36),
	`status` enum('validated','flagged','approved','deposited','cleared') NOT NULL DEFAULT 'validated',
	`created_at` datetime NOT NULL,
	CONSTRAINT `cheques_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` varchar(36) NOT NULL,
	`client_code` varchar(32) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`registration_no` varchar(128),
	`industry` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`address_json` json NOT NULL,
	`stripe_customer_id` varchar(255),
	`plan_type` enum('subscription','topup') NOT NULL,
	`plan_tier` enum('starter','professional','enterprise'),
	`wallet_balance` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`two_fa_enabled` boolean NOT NULL DEFAULT false,
	`two_fa_secret` varchar(255),
	`created_at` datetime NOT NULL,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_client_code_uq` UNIQUE(`client_code`)
);
--> statement-breakpoint
CREATE TABLE `deposit_batches` (
	`id` varchar(36) NOT NULL,
	`batch_date` varchar(10) NOT NULL,
	`total_amount` decimal(12,2) NOT NULL,
	`cheque_count` int NOT NULL,
	`bank_reference` varchar(255),
	`deposit_slip_url` text,
	`status` enum('pending','deposited','confirmed') NOT NULL DEFAULT 'pending',
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `deposit_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`otp` varchar(16) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`stripe_invoice_id` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`pdf_url` text,
	`status` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_stripe_invoice_uq` UNIQUE(`stripe_invoice_id`)
);
--> statement-breakpoint
CREATE TABLE `mail_items` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`irn` varchar(128) NOT NULL,
	`type` enum('letter','cheque','package','legal') NOT NULL,
	`envelope_front_url` text NOT NULL,
	`envelope_back_url` text NOT NULL,
	`content_scan_urls` json NOT NULL,
	`tamper_detected` boolean NOT NULL DEFAULT false,
	`tamper_annotations` json,
	`ocr_text` text,
	`ai_summary` text,
	`ai_actions` json,
	`ai_risk_level` enum('low','medium','high','critical'),
	`retention_until` datetime NOT NULL,
	`scanned_by` varchar(36) NOT NULL,
	`scanned_at` datetime NOT NULL,
	`status` enum('received','scanned','processed','delivered') NOT NULL DEFAULT 'received',
	`created_at` datetime NOT NULL,
	CONSTRAINT `mail_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `mail_items_irn_uq` UNIQUE(`irn`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('admin','operator','client') NOT NULL,
	`client_id` varchar(36),
	`created_at` datetime NOT NULL,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_uq` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`stripe_subscription_id` varchar(255) NOT NULL,
	`plan_tier` varchar(64) NOT NULL,
	`status` enum('active','past_due','canceled','trialing') NOT NULL,
	`current_period_start` datetime NOT NULL,
	`current_period_end` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripe_sub_uq` UNIQUE(`stripe_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` varchar(36) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`quantity` int NOT NULL,
	`unit_cost` decimal(12,2) NOT NULL,
	`total_cost` decimal(12,2) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`email_verified_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `cheques_mail_item_idx` ON `cheques` (`mail_item_id`);--> statement-breakpoint
CREATE INDEX `cheques_deposit_batch_idx` ON `cheques` (`deposit_batch_id`);--> statement-breakpoint
CREATE INDEX `cheques_client_decision_idx` ON `cheques` (`client_decision`);--> statement-breakpoint
CREATE INDEX `clients_email_idx` ON `clients` (`email`);--> statement-breakpoint
CREATE INDEX `deposit_batches_batch_date_idx` ON `deposit_batches` (`batch_date`);--> statement-breakpoint
CREATE INDEX `email_verifications_email_idx` ON `email_verifications` (`email`);--> statement-breakpoint
CREATE INDEX `invoices_client_idx` ON `invoices` (`client_id`);--> statement-breakpoint
CREATE INDEX `mail_items_client_idx` ON `mail_items` (`client_id`);--> statement-breakpoint
CREATE INDEX `mail_items_scanned_at_idx` ON `mail_items` (`scanned_at`);--> statement-breakpoint
CREATE INDEX `profiles_client_idx` ON `profiles` (`client_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_client_idx` ON `subscriptions` (`client_id`);--> statement-breakpoint
CREATE INDEX `usage_events_client_idx` ON `usage_events` (`client_id`);--> statement-breakpoint
CREATE INDEX `usage_events_created_at_idx` ON `usage_events` (`created_at`);
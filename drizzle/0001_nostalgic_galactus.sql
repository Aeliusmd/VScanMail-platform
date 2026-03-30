CREATE TABLE `company_directory` (
	`id` varchar(36) NOT NULL,
	`source_type` enum('client','manual') NOT NULL,
	`source_id` varchar(36) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`industry` varchar(128) NOT NULL,
	`phone` varchar(64) NOT NULL DEFAULT '',
	`status` enum('active','pending','suspended') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL,
	CONSTRAINT `company_directory_id` PRIMARY KEY(`id`),
	CONSTRAINT `cd_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `manually_added_clients` (
	`id` varchar(36) NOT NULL,
	`directory_id` varchar(36) NOT NULL,
	`added_by` varchar(36) NOT NULL,
	`contact_person` varchar(255),
	`website` varchar(255),
	`address_text` varchar(500),
	`notes` text,
	`payment_type` enum('cash','bank_transfer','cheque','other') NOT NULL DEFAULT 'other',
	`subscription_plan` enum('starter','professional','enterprise','custom','none') NOT NULL DEFAULT 'none',
	`subscription_amount` decimal(12,2) NOT NULL DEFAULT '0',
	`subscription_status` enum('active','pending','suspended') NOT NULL DEFAULT 'pending',
	`linked_client_id` varchar(36),
	`added_at` datetime NOT NULL,
	CONSTRAINT `manually_added_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cd_source_idx` ON `company_directory` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `cd_status_idx` ON `company_directory` (`status`);--> statement-breakpoint
CREATE INDEX `mac_directory_idx` ON `manually_added_clients` (`directory_id`);--> statement-breakpoint
CREATE INDEX `mac_added_by_idx` ON `manually_added_clients` (`added_by`);--> statement-breakpoint
CREATE INDEX `mac_linked_client_idx` ON `manually_added_clients` (`linked_client_id`);
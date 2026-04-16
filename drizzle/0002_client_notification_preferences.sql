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
CREATE INDEX `cnp_updated_by_idx` ON `client_notification_preferences` (`updated_by`);

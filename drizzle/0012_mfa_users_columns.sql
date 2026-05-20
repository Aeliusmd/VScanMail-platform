-- Add all columns not yet migrated: profile fields on users, MFA fields, and
-- structural columns on clients. Uses IF NOT EXISTS for idempotency (MySQL 8+).

-- ── users ──────────────────────────────────────────────────────────────────
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `first_name` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `last_name` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `phone` varchar(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `avatar_url` varchar(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `bio` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `language` varchar(10) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS `login_alerts_enabled` boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS `session_timeout` varchar(8) NOT NULL DEFAULT '30',
  ADD COLUMN IF NOT EXISTS `last_login_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `backup_email` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `backup_email_verified_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `is_active` boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
--> statement-breakpoint

-- Backup email must be unique (NULL values are exempt from the unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS `users_backup_email_uq` ON `users` (`backup_email`);
--> statement-breakpoint

-- ── clients ────────────────────────────────────────────────────────────────
ALTER TABLE `clients`
  ADD COLUMN IF NOT EXISTS `table_name` varchar(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `client_type` enum('subscription','manual') NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS `added_by` varchar(36) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
--> statement-breakpoint

-- Unique index for table_name if not already present
CREATE UNIQUE INDEX IF NOT EXISTS `clients_table_name_uq` ON `clients` (`table_name`);
--> statement-breakpoint

-- ── recovery_codes (new table) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `recovery_codes` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `created_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  CONSTRAINT `recovery_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `rc_user_idx` ON `recovery_codes` (`user_id`);

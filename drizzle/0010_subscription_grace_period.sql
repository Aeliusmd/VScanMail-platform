ALTER TABLE `subscriptions`
  MODIFY COLUMN `status` enum('active','past_due','canceled','trialing','paused','blocked') NOT NULL DEFAULT 'trialing';
--> statement-breakpoint
ALTER TABLE `subscriptions`
  ADD COLUMN `grace_period_until` datetime NULL AFTER `canceled_at`,
  ADD COLUMN `payment_failed_at` datetime NULL AFTER `grace_period_until`,
  ADD COLUMN `failed_payment_count` int NOT NULL DEFAULT 0 AFTER `payment_failed_at`;
--> statement-breakpoint
ALTER TABLE `clients`
  ADD COLUMN `suspended_reason` enum('admin','payment_overdue') NULL AFTER `notes`;
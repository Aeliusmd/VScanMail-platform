-- Idempotent setup + backfill for client_notification_preferences.
-- This is safe to run on existing DBs even if the table already exists.

CREATE TABLE IF NOT EXISTS `client_notification_preferences` (
  `client_id` varchar(36) NOT NULL,
  `email_enabled` boolean NOT NULL DEFAULT true,
  `new_mail_scanned` boolean NOT NULL DEFAULT true,
  `new_cheque_scanned` boolean NOT NULL DEFAULT true,
  `delivery_updates` boolean NOT NULL DEFAULT true,
  `deposit_updates` boolean NOT NULL DEFAULT false,
  `weekly_summary` boolean NOT NULL DEFAULT true,
  `updated_by` varchar(36),
  `updated_at` datetime NOT NULL,
  CONSTRAINT `client_notification_preferences_client_id` PRIMARY KEY (`client_id`)
);

-- MySQL does not support CREATE INDEX IF NOT EXISTS in all versions.
-- If this index already exists, applying will return ER_DUP_KEYNAME and can be safely ignored.
CREATE INDEX `cnp_updated_by_idx` ON `client_notification_preferences` (`updated_by`);

-- Backfill: ensure every client has a preferences row.
INSERT INTO `client_notification_preferences` (
  `client_id`,
  `email_enabled`,
  `new_mail_scanned`,
  `new_cheque_scanned`,
  `delivery_updates`,
  `deposit_updates`,
  `weekly_summary`,
  `updated_by`,
  `updated_at`
)
SELECT
  c.`id`,
  true,
  true,
  true,
  true,
  false,
  true,
  NULL,
  NOW()
FROM `clients` c
LEFT JOIN `client_notification_preferences` p
  ON p.`client_id` = c.`id`
WHERE p.`client_id` IS NULL;


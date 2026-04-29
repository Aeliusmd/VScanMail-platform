-- Customer portal account: org extras + per-user security prefs
ALTER TABLE `clients` ADD COLUMN `website` VARCHAR(500) DEFAULT NULL;
ALTER TABLE `clients` ADD COLUMN `employees` VARCHAR(32) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `login_alerts_enabled` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `users` ADD COLUMN `session_timeout` VARCHAR(8) NOT NULL DEFAULT '30';

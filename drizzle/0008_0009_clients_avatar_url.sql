-- Add organization-wide avatar (clients.avatar_url)
ALTER TABLE `clients` ADD COLUMN `avatar_url` VARCHAR(500) DEFAULT NULL;
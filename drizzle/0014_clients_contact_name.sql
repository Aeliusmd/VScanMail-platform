ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `contact_name` varchar(255) NULL;
ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `contact_email` varchar(255) NULL;

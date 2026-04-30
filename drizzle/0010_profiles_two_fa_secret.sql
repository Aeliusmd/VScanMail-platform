-- Add missing column used by Drizzle schema: profiles.two_fa_secret

ALTER TABLE `profiles`
  ADD COLUMN `two_fa_secret` varchar(255) NULL;


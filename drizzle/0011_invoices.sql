CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `stripe_invoice_id` varchar(255),
  `stripe_subscription_id` varchar(255),
  `invoice_number` varchar(64),
  `status` enum('paid','open','void','uncollectible','draft') NOT NULL DEFAULT 'draft',
  `amount_due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(8) NOT NULL DEFAULT 'usd',
  `plan_tier` enum('starter','professional','enterprise'),
  `description` varchar(500),
  `pdf_url` varchar(1000),
  `hosted_url` varchar(1000),
  `period_start` datetime,
  `period_end` datetime,
  `paid_at` datetime,
  `created_at` datetime NOT NULL,
  CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `inv_client_idx` ON `invoices` (`client_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `inv_stripe_uq` ON `invoices` (`stripe_invoice_id`);
--> statement-breakpoint
CREATE INDEX `inv_status_idx` ON `invoices` (`status`);
--> statement-breakpoint
CREATE INDEX `inv_created_idx` ON `invoices` (`created_at`);
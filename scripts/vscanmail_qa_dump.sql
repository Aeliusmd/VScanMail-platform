-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 10.103.0.91    Database: vscanmail
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `actor_id` varchar(36) NOT NULL,
  `actor_role` enum('super_admin','admin','client') NOT NULL,
  `action` varchar(128) NOT NULL,
  `entity_type` varchar(64) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `client_id` varchar(36) DEFAULT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `notif_recipient_id` varchar(36) DEFAULT NULL,
  `notif_is_read` tinyint(1) NOT NULL DEFAULT '0',
  `notif_title` varchar(255) DEFAULT NULL,
  `notif_target_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `al_actor_idx` (`actor_id`),
  KEY `al_role_idx` (`actor_role`),
  KEY `al_entity_idx` (`entity_type`,`entity_id`),
  KEY `al_action_idx` (`action`),
  KEY `al_created_idx` (`created_at`),
  KEY `al_client_idx` (`client_id`),
  KEY `al_notif_recipient_idx` (`notif_recipient_id`,`notif_is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `billing_contact_settings`
--

DROP TABLE IF EXISTS `billing_contact_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_contact_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_name` varchar(255) DEFAULT '',
  `contact_phone` varchar(64) DEFAULT '',
  `contact_email` varchar(255) DEFAULT '',
  `updated_by` varchar(36) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `billing_plans`
--

DROP TABLE IF EXISTS `billing_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_plans` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `max_companies` int NOT NULL,
  `max_scans` int NOT NULL,
  `storage` varchar(128) NOT NULL,
  `badge` varchar(128) DEFAULT NULL,
  `badge_color` varchar(128) DEFAULT NULL,
  `features` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `ai_magic` varchar(255) DEFAULT NULL,
  `cheque_handling` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_bank_accounts`
--

DROP TABLE IF EXISTS `client_bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_bank_accounts` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `bank_name` varchar(128) NOT NULL,
  `nickname` varchar(64) NOT NULL,
  `account_type` enum('checking','savings') NOT NULL,
  `account_last4` varchar(4) NOT NULL,
  `account_number_enc` varbinary(512) NOT NULL,
  `key_version` int NOT NULL DEFAULT '1',
  `account_number_hash` varchar(64) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `created_by` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cba_client_hash_uq` (`client_id`,`account_number_hash`),
  KEY `cba_client_idx` (`client_id`),
  KEY `cba_client_active_idx` (`client_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_notification_preferences`
--

DROP TABLE IF EXISTS `client_notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_notification_preferences` (
  `client_id` varchar(36) NOT NULL,
  `email_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `new_mail_scanned` tinyint(1) NOT NULL DEFAULT '1',
  `new_cheque_scanned` tinyint(1) NOT NULL DEFAULT '1',
  `delivery_updates` tinyint(1) NOT NULL DEFAULT '1',
  `deposit_updates` tinyint(1) NOT NULL DEFAULT '0',
  `weekly_summary` tinyint(1) NOT NULL DEFAULT '1',
  `updated_by` varchar(36) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`client_id`),
  KEY `cnp_updated_by_idx` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL,
  `client_code` varchar(32) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `registration_no` varchar(128) DEFAULT NULL,
  `industry` varchar(128) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(64) NOT NULL,
  `address_json` json NOT NULL,
  `client_type` enum('subscription','manual') NOT NULL DEFAULT 'subscription',
  `status` enum('active','suspended','pending','inactive') NOT NULL DEFAULT 'pending',
  `two_fa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `two_fa_secret` varchar(255) DEFAULT NULL,
  `added_by` varchar(36) DEFAULT NULL,
  `notes` text,
  `suspended_reason` enum('admin','payment_overdue') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `website` varchar(500) DEFAULT NULL,
  `employees` varchar(32) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_code_uq` (`client_code`),
  UNIQUE KEY `clients_table_name_uq` (`table_name`),
  UNIQUE KEY `clients_email_uq` (`email`),
  KEY `clients_status_idx` (`status`),
  KEY `clients_type_idx` (`client_type`),
  KEY `clients_added_by_idx` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_hidden_records`
--

DROP TABLE IF EXISTS `customer_hidden_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_hidden_records` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hidden_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chr_client_record_uq` (`client_id`,`record_id`),
  KEY `chr_client_idx` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delivery_addresses`
--

DROP TABLE IF EXISTS `delivery_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_addresses` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `label` varchar(64) NOT NULL,
  `recipient_name` varchar(128) NOT NULL,
  `line1` varchar(255) NOT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `city` varchar(128) NOT NULL,
  `state` varchar(32) NOT NULL,
  `zip` varchar(32) NOT NULL,
  `country` varchar(2) NOT NULL DEFAULT 'US',
  `phone` varchar(32) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `da_client_idx` (`client_id`),
  KEY `da_client_default_idx` (`client_id`,`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_verifications`
--

DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verifications` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(16) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ev_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(64) DEFAULT NULL,
  `status` enum('paid','open','void','uncollectible','draft') NOT NULL DEFAULT 'draft',
  `amount_due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(8) NOT NULL DEFAULT 'usd',
  `plan_tier` enum('starter','professional','enterprise') DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `pdf_url` varchar(1000) DEFAULT NULL,
  `hosted_url` varchar(1000) DEFAULT NULL,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inv_stripe_uq` (`stripe_invoice_id`),
  KEY `inv_client_idx` (`client_id`),
  KEY `inv_status_idx` (`status`),
  KEY `inv_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login_lockout`
--

DROP TABLE IF EXISTS `login_lockout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_lockout` (
  `email_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_count` int NOT NULL DEFAULT '0',
  `locked_until` bigint DEFAULT NULL,
  `updated_at` bigint NOT NULL,
  PRIMARY KEY (`email_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manual_payments`
--

DROP TABLE IF EXISTS `manual_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_payments` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `recorded_by` varchar(36) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','bank_transfer','cheque','other','card') NOT NULL DEFAULT 'other',
  `reference_no` varchar(255) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `notes` text,
  `payment_date` date NOT NULL,
  `period_covered` enum('monthly','quarterly','annual','custom') NOT NULL DEFAULT 'monthly',
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `created_at` datetime NOT NULL,
  `duration_months` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `mp_client_idx` (`client_id`),
  KEY `mp_recorder_idx` (`recorded_by`),
  KEY `mp_date_idx` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_qa001_records`
--

DROP TABLE IF EXISTS `org_qa001_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_qa001_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `created_at_idx` (`created_at`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsm0hsf_records`
--

DROP TABLE IF EXISTS `org_vsm0hsf_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsm0hsf_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `is_archived_idx` (`is_archived`),
  KEY `archived_at_idx` (`archived_at`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`),
  KEY `delivery_status_idx` (`delivery_status`),
  KEY `delivery_requested_at_idx` (`delivery_requested_at`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsmawk98_records`
--

DROP TABLE IF EXISTS `org_vsmawk98_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsmawk98_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `is_archived_idx` (`is_archived`),
  KEY `archived_at_idx` (`archived_at`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`),
  KEY `delivery_status_idx` (`delivery_status`),
  KEY `delivery_requested_at_idx` (`delivery_requested_at`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsmcxdz0_records`
--

DROP TABLE IF EXISTS `org_vsmcxdz0_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsmcxdz0_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `is_archived_idx` (`is_archived`),
  KEY `archived_at_idx` (`archived_at`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`),
  KEY `delivery_status_idx` (`delivery_status`),
  KEY `delivery_requested_at_idx` (`delivery_requested_at`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsmozrpo_records`
--

DROP TABLE IF EXISTS `org_vsmozrpo_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsmozrpo_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `is_archived_idx` (`is_archived`),
  KEY `archived_at_idx` (`archived_at`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`),
  KEY `delivery_status_idx` (`delivery_status`),
  KEY `delivery_requested_at_idx` (`delivery_requested_at`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsmtlmx_records`
--

DROP TABLE IF EXISTS `org_vsmtlmx_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsmtlmx_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `created_at_idx` (`created_at`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `org_vsmzizb_records`
--

DROP TABLE IF EXISTS `org_vsmzizb_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_vsmzizb_records` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `irn` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_type` enum('letter','cheque','package','legal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_front_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `envelope_back_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_scan_urls` json NOT NULL,
  `tamper_detected` tinyint(1) NOT NULL DEFAULT '0',
  `tamper_annotations` json DEFAULT NULL,
  `ocr_text` text COLLATE utf8mb4_unicode_ci,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `ai_actions` json DEFAULT NULL,
  `ai_risk_level` enum('none','low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_until` datetime NOT NULL,
  `scanned_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_at` datetime NOT NULL,
  `mail_status` enum('received','scanned','processed','delivered') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `cheque_amount_figures` decimal(12,2) DEFAULT NULL,
  `cheque_amount_words` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_amounts_match` tinyint(1) DEFAULT NULL,
  `cheque_date_on_cheque` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_date_valid` tinyint(1) DEFAULT NULL,
  `cheque_beneficiary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_beneficiary_match` decimal(6,4) DEFAULT NULL,
  `cheque_signature_present` tinyint(1) DEFAULT NULL,
  `cheque_alteration_detected` tinyint(1) DEFAULT NULL,
  `cheque_crossing_present` tinyint(1) DEFAULT NULL,
  `cheque_ai_confidence` decimal(6,4) DEFAULT NULL,
  `cheque_ai_raw_result` json DEFAULT NULL,
  `cheque_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cheque_decided_at` datetime DEFAULT NULL,
  `cheque_status` enum('validated','flagged','approved','deposit_requested','deposited','cleared') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_requested_at` datetime DEFAULT NULL,
  `deposit_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_account_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_nickname` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_destination_bank_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decision` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_decided_at` datetime DEFAULT NULL,
  `deposit_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_marked_deposited_at` datetime DEFAULT NULL,
  `deposit_slip_url` text COLLATE utf8mb4_unicode_ci,
  `deposit_slip_uploaded_at` datetime DEFAULT NULL,
  `deposit_slip_uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_slip_ai_result` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_status` enum('pending','approved','rejected','in_transit','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_requested_at` datetime DEFAULT NULL,
  `delivery_requested_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_city` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_state` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_zip` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_preferred_date` datetime DEFAULT NULL,
  `delivery_decided_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_decided_at` datetime DEFAULT NULL,
  `delivery_reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_in_transit_at` datetime DEFAULT NULL,
  `delivery_marked_delivered_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_marked_delivered_at` datetime DEFAULT NULL,
  `delivery_vsendocs_submission_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_vsendocs_submission_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_proof_of_service_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `cheque_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `delivery_customer_confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `irn_uq` (`irn`),
  KEY `record_type_idx` (`record_type`),
  KEY `mail_status_idx` (`mail_status`),
  KEY `scanned_at_idx` (`scanned_at`),
  KEY `risk_level_idx` (`ai_risk_level`),
  KEY `cheque_decision_idx` (`cheque_decision`),
  KEY `cheque_status_idx` (`cheque_status`),
  KEY `deposit_decision_idx` (`deposit_decision`),
  KEY `deposit_requested_at_idx` (`deposit_requested_at`),
  KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`),
  KEY `delivery_status_idx` (`delivery_status`),
  KEY `delivery_requested_at_idx` (`delivery_requested_at`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pr_token_uq` (`token`),
  KEY `pr_user_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('super_admin','admin','client') NOT NULL,
  `client_id` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `wo_fa_secret` varchar(255) DEFAULT NULL,
  `two_fa_secret` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_user_uq` (`user_id`),
  KEY `profiles_client_idx` (`client_id`),
  KEY `profiles_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rate_limit_buckets`
--

DROP TABLE IF EXISTS `rate_limit_buckets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit_buckets` (
  `key_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `count` int NOT NULL,
  `reset_at` bigint NOT NULL,
  PRIMARY KEY (`key_hash`),
  KEY `reset_at_idx` (`reset_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recovery_codes`
--

DROP TABLE IF EXISTS `recovery_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recovery_codes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rc_user_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `plan_tier` enum('starter','professional','enterprise') NOT NULL,
  `monthly_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','past_due','canceled','trialing','paused','blocked') NOT NULL DEFAULT 'trialing',
  `current_period_start` datetime NOT NULL,
  `current_period_end` datetime NOT NULL,
  `canceled_at` datetime DEFAULT NULL,
  `grace_period_until` datetime DEFAULT NULL,
  `payment_failed_at` datetime DEFAULT NULL,
  `failed_payment_count` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_stripe_uq` (`stripe_subscription_id`),
  KEY `sub_client_idx` (`client_id`),
  KEY `sub_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usage_events`
--

DROP TABLE IF EXISTS `usage_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usage_events` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `event_type` enum('scan','ai_analysis','storage','api_call') NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `triggered_by` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ue_client_idx` (`client_id`),
  KEY `ue_type_idx` (`event_type`),
  KEY `ue_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` text,
  `language` varchar(10) NOT NULL DEFAULT 'en',
  `login_alerts_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `session_timeout` varchar(8) NOT NULL DEFAULT '30',
  `backup_email` varchar(255) DEFAULT NULL,
  `backup_email_verified_at` datetime DEFAULT NULL,
  `mfa_enabled_at` datetime DEFAULT NULL,
  `totp_secret` varchar(255) DEFAULT NULL,
  `totp_enabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_uq` (`email`),
  UNIQUE KEY `users_backup_email_uq` (`backup_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-12 14:18:06
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 10.103.0.91    Database: vscanmail
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `billing_plans`
--

LOCK TABLES `billing_plans` WRITE;
/*!40000 ALTER TABLE `billing_plans` DISABLE KEYS */;
INSERT INTO `billing_plans` (`id`, `name`, `price`, `max_companies`, `max_scans`, `storage`, `badge`, `badge_color`, `features`, `is_active`, `created_at`, `updated_at`, `ai_magic`, `cheque_handling`) VALUES ('enterprise','Enterprise',199.00,1,999999,'100 GB+','Corporate Choice','bg-emerald-600','[\"Unlimited Scans\", \"100GB+ Storage\", \"Enterprise AI\", \"Dedicated Manager\"]',1,'2026-04-07 06:40:20','2026-04-08 05:20:53','Custom AI Workflows','Automated Deposit Requests'),('professional','Professional',79.00,1,250,'25 GB','Most Popular','bg-[#0A3D8F]','[\"250 Scans/mo\", \"25GB Storage\", \"Advanced AI\", \"Priority Support\"]',1,'2026-04-07 06:40:20','2026-04-08 05:20:53','AI Summary & Risk Detection','Priority Validation'),('starter','Starter',29.00,1,50,'5 GB','Best for Individuals','bg-slate-500','[\"50 Scans/mo\", \"5GB Storage\", \"Basic AI\", \"Standard Support\"]',1,'2026-04-07 06:40:20','2026-04-08 05:20:53','Basic OCR','Basic Validation');
/*!40000 ALTER TABLE `billing_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` (`id`, `hash`, `created_at`) VALUES (1,'6aafe00f45998583f347ab215755d80d1ec30e2757530d1293bb062178c83ba1',1776767028249),(2,'bf66f4dd6ca9c791c25c38a3d07615a9cd25058f22661f291d309a9a3f594e4f',1776767028256),(3,'7ea03c3ef8f36e36d68c0e0aceee50a61a1f9b3c0b88ae52dd3df461d41daed0',1776767028262),(4,'29106daec6554c9e2a796449b016947d8f864b80ff34b619912e389b56cdabd2',1776767028267),(5,'d83af4fa0c683fdc9bc048dc8a553487046e8156f215b670a8bfc5a74da505a9',1776767028273),(6,'b86fe5bed0ada991241126b850494264c66d9fa1e5e06cfaaa6c25fdea9fc055',1776767028279),(7,'91d18407e24ccff8cd99ec863b9bbbb94096283bb86be8b6afb8996822d5a5ca',1776767028285),(8,'6d35082b928df4759f5cc318f5dd51b5d2f0dc85a3100814b580d09ca7ec6e94',1776927600000),(9,'ba466dfbf460b8e20c412a350d620f866124639657de1e235b6b6c0c48c7e3fd',1777359800000),(10,'ee79a9609a5745769c2aef0742bffd390c6c1dd4b197aaf7ef83d14e0fe9cf04',1777629672730),(11,'281014f5014b7aab44cc4efad4579aa662dd9fbbc2ef56d224d2a78965a81fe8',1777641833270);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-12 14:18:06

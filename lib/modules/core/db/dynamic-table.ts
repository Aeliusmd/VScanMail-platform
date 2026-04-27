import { sql } from "drizzle-orm";
import { db } from "./mysql";
import { clients } from "./schema";
import { eq } from "drizzle-orm";

export async function createClientTable(tableName: string) {
  await db.execute(sql.raw(`
    CREATE TABLE \`${tableName}\` (
      \`id\`                         VARCHAR(36)  NOT NULL,
      \`irn\`                        VARCHAR(128) NOT NULL,
      \`record_type\`                 ENUM('letter','cheque','package','legal') NOT NULL,

      \`envelope_front_url\`          TEXT         NOT NULL,
      \`envelope_back_url\`           TEXT         NOT NULL,
      \`content_scan_urls\`           JSON         NOT NULL,
      \`tamper_detected\`             BOOLEAN      NOT NULL DEFAULT FALSE,
      \`tamper_annotations\`          JSON         NULL,

      \`ocr_text\`                    TEXT         NULL,
      \`ai_summary\`                  TEXT         NULL,
      \`ai_actions\`                  JSON         NULL,
      \`ai_risk_level\`               ENUM('none','low','medium','high','critical') NULL,

      \`retention_until\`             DATETIME     NOT NULL,
      \`scanned_by\`                  VARCHAR(36)  NOT NULL,
      \`scanned_at\`                  DATETIME     NOT NULL,
      \`mail_status\`                 ENUM('received','scanned','processed','delivered') NOT NULL DEFAULT 'received',

      \`cheque_amount_figures\`       DECIMAL(12,2) NULL,
      \`cheque_amount_words\`         VARCHAR(255)  NULL,
      \`cheque_amounts_match\`        BOOLEAN       NULL,
      \`cheque_date_on_cheque\`       VARCHAR(64)   NULL,
      \`cheque_date_valid\`           BOOLEAN       NULL,
      \`cheque_beneficiary\`          VARCHAR(255)  NULL,
      \`cheque_beneficiary_match\`    DECIMAL(6,4)  NULL,
      \`cheque_signature_present\`    BOOLEAN       NULL,
      \`cheque_alteration_detected\`  BOOLEAN       NULL,
      \`cheque_crossing_present\`     BOOLEAN       NULL,
      \`cheque_ai_confidence\`        DECIMAL(6,4)  NULL,
      \`cheque_ai_raw_result\`        JSON          NULL,

      \`cheque_decision\`             ENUM('pending','approved','rejected') NULL,
      \`cheque_decided_by\`           VARCHAR(36)   NULL,
      \`cheque_decided_at\`           DATETIME      NULL,
      \`cheque_status\`               ENUM('validated','flagged','approved','deposit_requested','deposited','cleared') NULL,

      \`deposit_requested_at\`        DATETIME      NULL,
      \`deposit_requested_by\`        VARCHAR(36)   NULL,
      \`deposit_destination_bank_account_id\` VARCHAR(36) NULL,
      \`deposit_destination_bank_name\`     VARCHAR(128) NULL,
      \`deposit_destination_bank_nickname\` VARCHAR(64)  NULL,
      \`deposit_destination_bank_last4\`    VARCHAR(4)   NULL,
      \`deposit_decision\`            ENUM('pending','approved','rejected') NULL,
      \`deposit_decided_by\`          VARCHAR(36)   NULL,
      \`deposit_decided_at\`          DATETIME      NULL,
      \`deposit_reject_reason\`       VARCHAR(255)  NULL,
      \`deposit_marked_deposited_by\` VARCHAR(36)   NULL,
      \`deposit_marked_deposited_at\` DATETIME      NULL,
      \`deposit_slip_url\`            TEXT          NULL,
      \`deposit_slip_uploaded_at\`    DATETIME      NULL,
      \`deposit_slip_uploaded_by\`    VARCHAR(36)   NULL,
      \`deposit_slip_ai_result\`      LONGTEXT      NULL,

      \`delivery_status\`             ENUM('pending','approved','rejected','in_transit','delivered','cancelled') NULL,
      \`delivery_requested_at\`       DATETIME      NULL,
      \`delivery_requested_by\`       VARCHAR(36)   NULL,
      \`delivery_address_id\`         VARCHAR(36)   NULL,
      \`delivery_address_name\`       VARCHAR(128)  NULL,
      \`delivery_address_line1\`      VARCHAR(255)  NULL,
      \`delivery_address_line2\`      VARCHAR(255)  NULL,
      \`delivery_address_city\`       VARCHAR(128)  NULL,
      \`delivery_address_state\`      VARCHAR(32)   NULL,
      \`delivery_address_zip\`        VARCHAR(32)   NULL,
      \`delivery_address_country\`    VARCHAR(2)    NULL,
      \`delivery_address_phone\`      VARCHAR(32)   NULL,
      \`delivery_address_email\`      VARCHAR(255)  NULL,
      \`delivery_notes\`              VARCHAR(500)  NULL,
      \`delivery_preferred_date\`     DATETIME      NULL,
      \`delivery_decided_by\`         VARCHAR(36)   NULL,
      \`delivery_decided_at\`         DATETIME      NULL,
      \`delivery_reject_reason\`      VARCHAR(255)  NULL,
      \`delivery_in_transit_at\`      DATETIME      NULL,
      \`delivery_marked_delivered_by\` VARCHAR(36)  NULL,
      \`delivery_marked_delivered_at\` DATETIME     NULL,
      \`delivery_vsendocs_submission_id\` VARCHAR(64) NULL,
      \`delivery_vsendocs_submission_number\` VARCHAR(64) NULL,
      \`delivery_tracking_number\`    VARCHAR(128)  NULL,
      \`delivery_proof_of_service_url\` TEXT        NULL,

      \`created_at\`                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`irn_uq\`            (\`irn\`),
      KEY \`record_type_idx\`          (\`record_type\`),
      KEY \`mail_status_idx\`          (\`mail_status\`),
      KEY \`scanned_at_idx\`           (\`scanned_at\`),
      KEY \`risk_level_idx\`           (\`ai_risk_level\`),
      KEY \`cheque_decision_idx\`      (\`cheque_decision\`),
      KEY \`cheque_status_idx\`        (\`cheque_status\`),
      KEY \`deposit_decision_idx\`     (\`deposit_decision\`),
      KEY \`deposit_requested_at_idx\` (\`deposit_requested_at\`),
      KEY \`deposit_slip_uploaded_at_idx\` (\`deposit_slip_uploaded_at\`),
      KEY \`delivery_status_idx\`      (\`delivery_status\`),
      KEY \`delivery_requested_at_idx\` (\`delivery_requested_at\`),
      KEY \`created_at_idx\`           (\`created_at\`)
    )
  `));
}

function escapeSqlString(value: string): string {
  return String(value).replace(/'/g, "''");
}

/**
 * Backfills delivery columns for older client record tables created before delivery support existed.
 * Safe to call repeatedly; it becomes a no-op once the columns exist.
 */
export async function ensureClientTableDeliveryColumns(tableName: string): Promise<void> {
  const deliveryColumnDefs: Array<{ name: string; sql: string }> = [
    {
      name: "delivery_status",
      sql: "`delivery_status` ENUM('pending','approved','rejected','in_transit','delivered','cancelled') NULL",
    },
    { name: "delivery_requested_at", sql: "`delivery_requested_at` DATETIME NULL" },
    { name: "delivery_requested_by", sql: "`delivery_requested_by` VARCHAR(36) NULL" },
    { name: "delivery_address_id", sql: "`delivery_address_id` VARCHAR(36) NULL" },
    { name: "delivery_address_name", sql: "`delivery_address_name` VARCHAR(128) NULL" },
    { name: "delivery_address_line1", sql: "`delivery_address_line1` VARCHAR(255) NULL" },
    { name: "delivery_address_line2", sql: "`delivery_address_line2` VARCHAR(255) NULL" },
    { name: "delivery_address_city", sql: "`delivery_address_city` VARCHAR(128) NULL" },
    { name: "delivery_address_state", sql: "`delivery_address_state` VARCHAR(32) NULL" },
    { name: "delivery_address_zip", sql: "`delivery_address_zip` VARCHAR(32) NULL" },
    { name: "delivery_address_country", sql: "`delivery_address_country` VARCHAR(2) NULL" },
    { name: "delivery_address_phone", sql: "`delivery_address_phone` VARCHAR(32) NULL" },
    { name: "delivery_address_email", sql: "`delivery_address_email` VARCHAR(255) NULL" },
    { name: "delivery_notes", sql: "`delivery_notes` VARCHAR(500) NULL" },
    { name: "delivery_preferred_date", sql: "`delivery_preferred_date` DATETIME NULL" },
    { name: "delivery_decided_by", sql: "`delivery_decided_by` VARCHAR(36) NULL" },
    { name: "delivery_decided_at", sql: "`delivery_decided_at` DATETIME NULL" },
    { name: "delivery_reject_reason", sql: "`delivery_reject_reason` VARCHAR(255) NULL" },
    { name: "delivery_in_transit_at", sql: "`delivery_in_transit_at` DATETIME NULL" },
    { name: "delivery_marked_delivered_by", sql: "`delivery_marked_delivered_by` VARCHAR(36) NULL" },
    { name: "delivery_marked_delivered_at", sql: "`delivery_marked_delivered_at` DATETIME NULL" },
    { name: "delivery_vsendocs_submission_id", sql: "`delivery_vsendocs_submission_id` VARCHAR(64) NULL" },
    { name: "delivery_vsendocs_submission_number", sql: "`delivery_vsendocs_submission_number` VARCHAR(64) NULL" },
    { name: "delivery_tracking_number", sql: "`delivery_tracking_number` VARCHAR(128) NULL" },
    { name: "delivery_proof_of_service_url", sql: "`delivery_proof_of_service_url` TEXT NULL" },
  ];

  // First, try the MySQL 8.0+ fast-path (ADD COLUMN IF NOT EXISTS).
  try {
    const alterSql = `ALTER TABLE \`${tableName}\`\n  ${deliveryColumnDefs
      .map((c) => `ADD COLUMN IF NOT EXISTS ${c.sql}`)
      .join(",\n  ")}`;
    await db.execute(sql.raw(alterSql));
    return;
  } catch (err) {
    // If the server doesn't support IF NOT EXISTS syntax (or any other failure),
    // fall back to checking INFORMATION_SCHEMA and adding only missing columns.
  }

  const columnNamesList = deliveryColumnDefs.map((c) => `'${escapeSqlString(c.name)}'`).join(", ");
  const [existingRows] = (await db.execute(
    sql.raw(
      `SELECT COLUMN_NAME AS name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = '${escapeSqlString(tableName)}'
         AND COLUMN_NAME IN (${columnNamesList})`
    )
  )) as any;

  const existing = new Set<string>((existingRows as any[]).map((r) => String(r.name)));
  const missing = deliveryColumnDefs.filter((c) => !existing.has(c.name));
  if (!missing.length) return;

  const alterSql = `ALTER TABLE \`${tableName}\`\n  ${missing
    .map((c) => `ADD COLUMN ${c.sql}`)
    .join(",\n  ")}`;
  await db.execute(sql.raw(alterSql));
}

/**
 * Backfills deposit columns for older client record tables created before deposit support existed.
 * Safe to call repeatedly; it becomes a no-op once the columns exist.
 */
export async function ensureClientTableDepositColumns(tableName: string): Promise<void> {
  const depositColumnDefs: Array<{ name: string; sql: string }> = [
    { name: "deposit_requested_at", sql: "`deposit_requested_at` DATETIME NULL" },
    { name: "deposit_requested_by", sql: "`deposit_requested_by` VARCHAR(36) NULL" },
    { name: "deposit_destination_bank_account_id", sql: "`deposit_destination_bank_account_id` VARCHAR(36) NULL" },
    { name: "deposit_destination_bank_name", sql: "`deposit_destination_bank_name` VARCHAR(128) NULL" },
    { name: "deposit_destination_bank_nickname", sql: "`deposit_destination_bank_nickname` VARCHAR(64) NULL" },
    { name: "deposit_destination_bank_last4", sql: "`deposit_destination_bank_last4` VARCHAR(4) NULL" },
    { name: "deposit_decision", sql: "`deposit_decision` ENUM('pending','approved','rejected') NULL" },
    { name: "deposit_decided_by", sql: "`deposit_decided_by` VARCHAR(36) NULL" },
    { name: "deposit_decided_at", sql: "`deposit_decided_at` DATETIME NULL" },
    { name: "deposit_reject_reason", sql: "`deposit_reject_reason` VARCHAR(255) NULL" },
    { name: "deposit_marked_deposited_by", sql: "`deposit_marked_deposited_by` VARCHAR(36) NULL" },
    { name: "deposit_marked_deposited_at", sql: "`deposit_marked_deposited_at` DATETIME NULL" },
    { name: "deposit_slip_url", sql: "`deposit_slip_url` TEXT NULL" },
    { name: "deposit_slip_uploaded_at", sql: "`deposit_slip_uploaded_at` DATETIME NULL" },
    { name: "deposit_slip_uploaded_by", sql: "`deposit_slip_uploaded_by` VARCHAR(36) NULL" },
    // Use LONGTEXT instead of JSON for widest MySQL/MariaDB compatibility.
    { name: "deposit_slip_ai_result", sql: "`deposit_slip_ai_result` LONGTEXT NULL" },
  ];

  const tryEnforceTypes = async () => {
    // Older tables might have the right columns but wrong types (e.g. VARCHAR too small, or JSON unsupported).
    // Best-effort: if this fails on some engines, swallow and continue.
    try {
      await db.execute(
        sql.raw(
          `ALTER TABLE \`${tableName}\`
             MODIFY COLUMN \`deposit_slip_ai_result\` LONGTEXT NULL,
             MODIFY COLUMN \`deposit_slip_url\` TEXT NULL`
        )
      );
    } catch {
      // ignore
    }
  };

  try {
    const alterSql = `ALTER TABLE \`${tableName}\`\n  ${depositColumnDefs
      .map((c) => `ADD COLUMN IF NOT EXISTS ${c.sql}`)
      .join(",\n  ")}`;
    await db.execute(sql.raw(alterSql));
    await tryEnforceTypes();
    return;
  } catch (err) {
    // Older MySQL versions may not support ADD COLUMN IF NOT EXISTS.
  }

  const columnNamesList = depositColumnDefs.map((c) => `'${escapeSqlString(c.name)}'`).join(", ");
  const [existingRows] = (await db.execute(
    sql.raw(
      `SELECT COLUMN_NAME AS name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = '${escapeSqlString(tableName)}'
         AND COLUMN_NAME IN (${columnNamesList})`
    )
  )) as any;

  const existing = new Set<string>((existingRows as any[]).map((r) => String(r.name)));
  const missing = depositColumnDefs.filter((c) => !existing.has(c.name));
  if (!missing.length) {
    await tryEnforceTypes();
    return;
  }

  const alterSql = `ALTER TABLE \`${tableName}\`\n  ${missing
    .map((c) => `ADD COLUMN ${c.sql}`)
    .join(",\n  ")}`;
  await db.execute(sql.raw(alterSql));
  await tryEnforceTypes();
}

export async function dropClientTable(tableName: string) {
  await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
}

export async function getClientTableName(clientId: string): Promise<string> {
  const [client] = await db
    .select({ tableName: clients.tableName })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
    
  if (!client) throw new Error("Client not found");
  return client.tableName;
}

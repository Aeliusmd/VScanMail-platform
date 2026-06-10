import { sql } from "drizzle-orm";
import { db } from "./mysql";
import { clients } from "./schema";
import { eq } from "drizzle-orm";

const ORG_TABLE_CHARSET = "utf8mb4";
const ORG_TABLE_COLLATION = "utf8mb4_unicode_ci";

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
      \`is_archived\`                 TINYINT(1)   NULL DEFAULT NULL,
      \`archived_at\`                 DATETIME     NULL,

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
      \`cheque_type\`                 VARCHAR(20)   NULL DEFAULT 'unknown',

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
      KEY \`is_archived_idx\`          (\`is_archived\`),
      KEY \`archived_at_idx\`          (\`archived_at\`),
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
    ) CHARACTER SET ${ORG_TABLE_CHARSET} COLLATE ${ORG_TABLE_COLLATION}
  `));
}

function escapeSqlString(value: string): string {
  return String(value).replace(/'/g, "''");
}

function escapeIdent(value: string): string {
  return `\`${String(value).replace(/`/g, "``")}\``;
}

/**
 * ---------------------------------------------------------------------------
 * Schema "ensure" helpers — performance-critical.
 *
 * These backfill columns / widen types on older per-client tables. They used to
 * run blind `ALTER TABLE` statements (including unconditional `MODIFY COLUMN`)
 * on every read request, which is extremely slow: a single ENUM `MODIFY` forces
 * a full table rebuild + metadata lock (measured ~4s even on a 3-row table).
 *
 * They are now:
 *   1. Memoized per process — each (operation, table) does its work at most once
 *      per server lifetime; subsequent calls are an in-memory no-op.
 *   2. Conditional — they introspect INFORMATION_SCHEMA first and only emit DDL
 *      when a column is actually missing or a type is actually wrong. When the
 *      schema is already correct (the normal case) they emit ZERO `ALTER`s.
 *
 * Net effect: identical end-state schema and identical repair behavior for old
 * tables, but no DDL on the hot path. Failures are not cached, so a transient
 * error can still be retried on a later request.
 * ---------------------------------------------------------------------------
 */

declare global {
  // eslint-disable-next-line no-var
  var __vscanmail_ensure_memo: Map<string, Promise<void>> | undefined;
}

// Stored on globalThis (like the MySQL pool) so the cache survives Next.js dev
// HMR module reloads and persists for the whole server process in production.
const ensureMemo =
  globalThis.__vscanmail_ensure_memo ?? new Map<string, Promise<void>>();
globalThis.__vscanmail_ensure_memo = ensureMemo;

/** Run `work` at most once per process for a given key; do not cache failures. */
function ensureOnce(key: string, work: () => Promise<void>): Promise<void> {
  let p = ensureMemo.get(key);
  if (!p) {
    p = work().catch((err) => {
      ensureMemo.delete(key);
      throw err;
    });
    ensureMemo.set(key, p);
  }
  return p;
}

type ColumnInfo = Map<string, string>; // column name -> COLUMN_TYPE (lowercased)

async function getColumnInfo(tableName: string): Promise<ColumnInfo> {
  const [rows] = (await db.execute(
    sql.raw(
      `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = '${escapeSqlString(tableName)}'`
    )
  )) as any;
  const map: ColumnInfo = new Map();
  for (const r of rows as any[]) {
    map.set(String(r.name), String(r.type ?? "").toLowerCase());
  }
  return map;
}

/** Adds only the columns that are absent. No-op (no DDL) when all present. */
async function addMissingColumns(
  tableName: string,
  existing: ColumnInfo,
  defs: Array<{ name: string; sql: string }>
): Promise<void> {
  const missing = defs.filter((c) => !existing.has(c.name));
  if (!missing.length) return;
  const alterSql = `ALTER TABLE ${escapeIdent(tableName)}\n  ${missing
    .map((c) => `ADD COLUMN ${c.sql}`)
    .join(",\n  ")}`;
  await db.execute(sql.raw(alterSql));
}

const CHEQUE_STATUS_ENUM =
  "enum('validated','flagged','approved','deposit_requested','deposited','cleared')";

/**
 * Backfills archive columns for older client record tables.
 * Safe to call repeatedly; runs its DDL at most once per process and only when
 * a column is missing.
 */
export async function ensureClientTableArchiveColumns(tableName: string): Promise<void> {
  return ensureOnce(`archive:${tableName}`, async () => {
    const existing = await getColumnInfo(tableName);
    await addMissingColumns(tableName, existing, [
      { name: "is_archived", sql: "`is_archived` TINYINT(1) NULL DEFAULT NULL" },
      { name: "archived_at", sql: "`archived_at` DATETIME NULL" },
    ]);
  });
}

/**
 * Backfills delivery columns for older client record tables created before
 * delivery support existed. Runs DDL at most once per process and only for
 * columns that are actually missing.
 */
export async function ensureClientTableDeliveryColumns(tableName: string): Promise<void> {
  return ensureOnce(`delivery:${tableName}`, async () => {
    const existing = await getColumnInfo(tableName);
    await addMissingColumns(tableName, existing, [
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
      // Core column added after initial schema — ensures SELECT * UNION ALL column counts match across all org tables.
      { name: "ai_summary", sql: "`ai_summary` TEXT NULL" },
    ]);
  });
}

/**
 * Backfills deposit columns for older client record tables created before
 * deposit support existed, and widens/normalizes types only when they differ.
 * Runs DDL at most once per process; emits zero `ALTER`s when already correct.
 */
export async function ensureClientTableDepositColumns(tableName: string): Promise<void> {
  return ensureOnce(`deposit:${tableName}`, async () => {
    const existing = await getColumnInfo(tableName);

    // 1) Widen cheque_status ONLY when it isn't already the target ENUM and
    //    isn't already a VARCHAR fallback. (Blind MODIFY rebuilds the table.)
    const statusType = existing.get("cheque_status");
    const needsWiden =
      statusType !== undefined &&
      statusType !== CHEQUE_STATUS_ENUM &&
      !statusType.startsWith("varchar");
    if (needsWiden) {
      try {
        await db.execute(
          sql.raw(
            `ALTER TABLE ${escapeIdent(tableName)}
               MODIFY COLUMN \`cheque_status\` ENUM('validated','flagged','approved','deposit_requested','deposited','cleared') NULL`
          )
        );
      } catch {
        // ENUM MODIFY failed (e.g. old schema missing deposit_requested). Fall back
        // to VARCHAR so any status string can be stored without a strict-mode error.
        try {
          await db.execute(
            sql.raw(
              `ALTER TABLE ${escapeIdent(tableName)}
                 MODIFY COLUMN \`cheque_status\` VARCHAR(64) NULL`
            )
          );
        } catch {
          // Column is genuinely unavailable — deposit updates will fail with a DB error.
        }
      }
    }

    // 2) Add any missing deposit columns (new columns are created with the
    //    correct type, so they need no later MODIFY).
    await addMissingColumns(tableName, existing, [
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
      // Core column added after initial schema — ensure it exists on older tables.
      { name: "ai_summary", sql: "`ai_summary` TEXT NULL" },
    ]);

    // 3) Enforce slip column types ONLY when an existing column has the wrong
    //    type. (A column we just added above is already correct, so its prior
    //    absence means "ok".)
    const aiType = existing.get("deposit_slip_ai_result");
    const urlType = existing.get("deposit_slip_url");
    const aiWrong = aiType !== undefined && aiType !== "longtext";
    const urlWrong = urlType !== undefined && urlType !== "text";
    if (aiWrong || urlWrong) {
      try {
        await db.execute(
          sql.raw(
            `ALTER TABLE ${escapeIdent(tableName)}
               MODIFY COLUMN \`deposit_slip_ai_result\` LONGTEXT NULL,
               MODIFY COLUMN \`deposit_slip_url\` TEXT NULL`
          )
        );
      } catch {
        // ignore — best effort on engines that reject the MODIFY
      }
    }
  });
}

/**
 * Ensures the cheque_type column exists. Runs DDL at most once per process and
 * only when the column is missing.
 */
export async function ensureClientTableChequeTypeColumn(tableName: string): Promise<void> {
  return ensureOnce(`chequeType:${tableName}`, async () => {
    const existing = await getColumnInfo(tableName);
    await addMissingColumns(tableName, existing, [
      { name: "cheque_type", sql: "`cheque_type` VARCHAR(20) NULL DEFAULT 'unknown'" },
    ]);
  });
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

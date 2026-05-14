import dotenv from "dotenv";

// Prefer `.env.local` (matches Next.js dev), fallback to `.env`
dotenv.config({ path: ".env.local" });
dotenv.config();

import { sql } from "drizzle-orm";

type Column = {
  name: string;
  ddl: string;
};

let db: any;

const requiredColumns: Column[] = [
  { name: "deposit_requested_at", ddl: "DATETIME NULL" },
  { name: "deposit_requested_by", ddl: "VARCHAR(36) NULL" },
  { name: "deposit_destination_bank_account_id", ddl: "VARCHAR(36) NULL" },
  { name: "deposit_destination_bank_name", ddl: "VARCHAR(128) NULL" },
  { name: "deposit_destination_bank_nickname", ddl: "VARCHAR(64) NULL" },
  { name: "deposit_destination_bank_last4", ddl: "VARCHAR(4) NULL" },
  { name: "deposit_decision", ddl: "ENUM('pending','approved','rejected') NULL" },
  { name: "deposit_decided_by", ddl: "VARCHAR(36) NULL" },
  { name: "deposit_decided_at", ddl: "DATETIME NULL" },
  { name: "deposit_reject_reason", ddl: "VARCHAR(255) NULL" },
  { name: "deposit_marked_deposited_by", ddl: "VARCHAR(36) NULL" },
  { name: "deposit_marked_deposited_at", ddl: "DATETIME NULL" },
  { name: "deposit_slip_url", ddl: "TEXT NULL" },
  { name: "deposit_slip_uploaded_at", ddl: "DATETIME NULL" },
  { name: "deposit_slip_uploaded_by", ddl: "VARCHAR(36) NULL" },
  { name: "deposit_slip_ai_result", ddl: "LONGTEXT NULL" },
  { name: "ai_summary", ddl: "TEXT NULL" },
];

const requiredIndexes: { name: string; ddl: string }[] = [
  { name: "deposit_decision_idx", ddl: "KEY `deposit_decision_idx` (`deposit_decision`)" },
  { name: "deposit_requested_at_idx", ddl: "KEY `deposit_requested_at_idx` (`deposit_requested_at`)" },
  { name: "deposit_slip_uploaded_at_idx", ddl: "KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`)" },
];

function escapeIdent(ident: string) {
  return `\`${ident.replace(/`/g, "``")}\``;
}

function isDuplicateColumnError(error: unknown): boolean {
  const err = error as { code?: string; errno?: number; message?: string };
  return (
    err?.code === "ER_DUP_FIELDNAME" ||
    err?.errno === 1060 ||
    /Duplicate column name/i.test(String(err?.message || ""))
  );
}

function isDuplicateIndexError(error: unknown): boolean {
  const err = error as { code?: string; errno?: number; message?: string };
  return (
    err?.code === "ER_DUP_KEYNAME" ||
    err?.errno === 1061 ||
    /Duplicate key name/i.test(String(err?.message || ""))
  );
}

async function tableExists(tableName: string) {
  const [rows] = (await db.execute(sql.raw(`SHOW TABLES LIKE '${tableName.replace(/'/g, "''")}'`))) as any;
  return Array.isArray(rows) && rows.length > 0;
}

async function getExistingColumns(tableName: string, schemaName: string) {
  try {
    const [rows] = (await db.execute(sql.raw(`SHOW COLUMNS FROM ${escapeIdent(tableName)}`))) as any;
    return new Set((rows as any[]).map((r) => String(r.Field || r.field || r.COLUMN_NAME || r.name)));
  } catch {
    // Fall back to INFORMATION_SCHEMA below.
  }

  const [rows] = (await db.execute(
    sql.raw(
      `SELECT COLUMN_NAME AS name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = '${schemaName.replace(/'/g, "''")}'
         AND TABLE_NAME = '${tableName.replace(/'/g, "''")}'`
    )
  )) as any;
  return new Set((rows as any[]).map((r) => String(r.name)));
}

async function getExistingIndexes(tableName: string, schemaName: string) {
  const [rows] = (await db.execute(
    sql.raw(
      `SELECT INDEX_NAME AS name
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = '${schemaName.replace(/'/g, "''")}'
         AND TABLE_NAME = '${tableName.replace(/'/g, "''")}'`
    )
  )) as any;
  return new Set((rows as any[]).map((r) => String(r.name)));
}

async function main() {
  const schemaName = process.env.MYSQL_DATABASE;
  if (!schemaName) throw new Error("MYSQL_DATABASE is required");

  console.log("Adding deposit columns to dynamic client tables...");

  // Import DB after dotenv has loaded env vars.
  ({ db } = await import("../lib/modules/core/db/mysql"));
  const { clients } = await import("../lib/modules/core/db/schema");

  const allClients = await db.select().from(clients);

  for (const client of allClients) {
    const tableName = (client as any).tableName as string | null;
    if (!tableName) continue;

    const exists = await tableExists(tableName);
    if (!exists) {
      console.log(`- Skipping missing table: ${tableName}`);
      continue;
    }

    const columns = await getExistingColumns(tableName, schemaName);
    const indexes = await getExistingIndexes(tableName, schemaName);

    let changes = 0;

    // 1) Ensure cheque_status enum includes deposit values
    // Always attempt to widen enum (safe) if column exists.
    if (columns.has("cheque_status")) {
      await db.execute(
        sql.raw(
          `ALTER TABLE ${escapeIdent(tableName)} MODIFY COLUMN \`cheque_status\` ENUM('validated','flagged','approved','deposit_requested','deposited','cleared') NULL`
        )
      );
      changes++;
    }

    // 2) Add missing columns
    for (const col of requiredColumns) {
      if (!columns.has(col.name)) {
        try {
          await db.execute(sql.raw(`ALTER TABLE ${escapeIdent(tableName)} ADD COLUMN ${escapeIdent(col.name)} ${col.ddl}`));
          changes++;
        } catch (error) {
          if (!isDuplicateColumnError(error)) throw error;
        }
        columns.add(col.name);
      }
    }

    try {
      await db.execute(
        sql.raw(
          `ALTER TABLE ${escapeIdent(tableName)}
             MODIFY COLUMN \`deposit_slip_ai_result\` LONGTEXT NULL,
             MODIFY COLUMN \`deposit_slip_url\` TEXT NULL`
        )
      );
    } catch {
      // Best effort only; the runtime helper also enforces this.
    }

    // 3) Add indexes (only if the underlying column exists)
    for (const idx of requiredIndexes) {
      const canAdd =
        (idx.name === "deposit_decision_idx" && columns.has("deposit_decision")) ||
        (idx.name === "deposit_requested_at_idx" && columns.has("deposit_requested_at")) ||
        (idx.name === "deposit_slip_uploaded_at_idx" && columns.has("deposit_slip_uploaded_at"));
      if (canAdd && !indexes.has(idx.name)) {
        try {
          await db.execute(sql.raw(`ALTER TABLE ${escapeIdent(tableName)} ADD ${idx.ddl}`));
          changes++;
        } catch (error) {
          if (!isDuplicateIndexError(error)) throw error;
        }
      }
    }

    if (changes === 0) {
      console.log(`✅ ${tableName}: already up to date`);
      continue;
    }

    console.log(`🚀 ${tableName}: applied ${changes} changes`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

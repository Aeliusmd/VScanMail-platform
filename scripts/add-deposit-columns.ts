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
  { name: "deposit_slip_ai_result", ddl: "JSON NULL" },
];

const requiredIndexes: { name: string; ddl: string }[] = [
  { name: "deposit_decision_idx", ddl: "KEY `deposit_decision_idx` (`deposit_decision`)" },
  { name: "deposit_requested_at_idx", ddl: "KEY `deposit_requested_at_idx` (`deposit_requested_at`)" },
  { name: "deposit_slip_uploaded_at_idx", ddl: "KEY `deposit_slip_uploaded_at_idx` (`deposit_slip_uploaded_at`)" },
];

function escapeIdent(ident: string) {
  return `\`${ident.replace(/`/g, "``")}\``;
}

async function tableExists(tableName: string) {
  const [rows] = (await db.execute(sql.raw(`SHOW TABLES LIKE '${tableName.replace(/'/g, "''")}'`))) as any;
  return Array.isArray(rows) && rows.length > 0;
}

async function getExistingColumns(tableName: string, schemaName: string) {
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

    const alterParts: string[] = [];

    // 1) Ensure cheque_status enum includes deposit values
    // Always attempt to widen enum (safe) if column exists.
    if (columns.has("cheque_status")) {
      alterParts.push(
        "MODIFY COLUMN `cheque_status` ENUM('validated','flagged','approved','deposit_requested','deposited','cleared') NULL"
      );
    }

    // 2) Add missing columns
    for (const col of requiredColumns) {
      if (!columns.has(col.name)) {
        alterParts.push(`ADD COLUMN ${escapeIdent(col.name)} ${col.ddl}`);
      }
    }

    // 3) Add indexes (only if the underlying column exists)
    for (const idx of requiredIndexes) {
      const canAdd =
        (idx.name === "deposit_decision_idx" && columns.has("deposit_decision")) ||
        (idx.name === "deposit_requested_at_idx" && columns.has("deposit_requested_at")) ||
        (idx.name === "deposit_slip_uploaded_at_idx" && columns.has("deposit_slip_uploaded_at"));
      if (canAdd && !indexes.has(idx.name)) {
        alterParts.push(`ADD ${idx.ddl}`);
      }
    }

    if (alterParts.length === 0) {
      console.log(`✅ ${tableName}: already up to date`);
      continue;
    }

    const alterSql = `ALTER TABLE ${escapeIdent(tableName)} ${alterParts.join(", ")}`;
    console.log(`🚀 ${tableName}: applying ${alterParts.length} changes`);
    await db.execute(sql.raw(alterSql));
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});


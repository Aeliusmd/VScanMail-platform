import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { sql } from "drizzle-orm";

type Column = {
  name: string;
  ddl: string;
};

let db: any;

const requiredColumns: Column[] = [
  {
    name: "delivery_status",
    ddl: "ENUM('pending','approved','rejected','in_transit','delivered','cancelled') NULL",
  },
  { name: "delivery_requested_at", ddl: "DATETIME NULL" },
  { name: "delivery_requested_by", ddl: "VARCHAR(36) NULL" },
  { name: "delivery_address_id", ddl: "VARCHAR(36) NULL" },
  { name: "delivery_address_name", ddl: "VARCHAR(128) NULL" },
  { name: "delivery_address_line1", ddl: "VARCHAR(255) NULL" },
  { name: "delivery_address_line2", ddl: "VARCHAR(255) NULL" },
  { name: "delivery_address_city", ddl: "VARCHAR(128) NULL" },
  { name: "delivery_address_state", ddl: "VARCHAR(32) NULL" },
  { name: "delivery_address_zip", ddl: "VARCHAR(32) NULL" },
  { name: "delivery_address_country", ddl: "VARCHAR(2) NULL" },
  { name: "delivery_address_phone", ddl: "VARCHAR(32) NULL" },
  { name: "delivery_address_email", ddl: "VARCHAR(255) NULL" },
  { name: "delivery_notes", ddl: "VARCHAR(500) NULL" },
  { name: "delivery_preferred_date", ddl: "DATETIME NULL" },
  { name: "delivery_decided_by", ddl: "VARCHAR(36) NULL" },
  { name: "delivery_decided_at", ddl: "DATETIME NULL" },
  { name: "delivery_reject_reason", ddl: "VARCHAR(255) NULL" },
  { name: "delivery_in_transit_at", ddl: "DATETIME NULL" },
  { name: "delivery_marked_delivered_by", ddl: "VARCHAR(36) NULL" },
  { name: "delivery_marked_delivered_at", ddl: "DATETIME NULL" },
  { name: "delivery_vsendocs_submission_id", ddl: "VARCHAR(64) NULL" },
  { name: "delivery_vsendocs_submission_number", ddl: "VARCHAR(64) NULL" },
  { name: "delivery_tracking_number", ddl: "VARCHAR(128) NULL" },
  { name: "delivery_proof_of_service_url", ddl: "TEXT NULL" },
];

const requiredIndexes: { name: string; ddl: string; column: string }[] = [
  { name: "delivery_status_idx", ddl: "KEY `delivery_status_idx` (`delivery_status`)", column: "delivery_status" },
  {
    name: "delivery_requested_at_idx",
    ddl: "KEY `delivery_requested_at_idx` (`delivery_requested_at`)",
    column: "delivery_requested_at",
  },
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

  ({ db } = await import("../lib/modules/core/db/mysql"));
  const { clients } = await import("../lib/modules/core/db/schema");

  console.log("Adding delivery columns to dynamic client tables...");

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

    for (const col of requiredColumns) {
      if (!columns.has(col.name)) {
        alterParts.push(`ADD COLUMN ${escapeIdent(col.name)} ${col.ddl}`);
      }
    }

    for (const idx of requiredIndexes) {
      if (columns.has(idx.column) && !indexes.has(idx.name)) {
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

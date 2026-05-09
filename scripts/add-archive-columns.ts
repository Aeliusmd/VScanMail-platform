import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { sql } from "drizzle-orm";

let db: any;

const requiredColumns = [
  { name: "is_archived", ddl: "TINYINT(1) NULL DEFAULT NULL" },
  { name: "archived_at", ddl: "DATETIME NULL" },
];

function escapeIdent(ident: string) {
  return `\`${ident.replace(/`/g, "``")}\``;
}

async function tableExists(tableName: string) {
  const [rows] = (await db.execute(
    sql.raw(`SHOW TABLES LIKE '${tableName.replace(/'/g, "''")}'`)
  )) as any;
  return Array.isArray(rows) && rows.length > 0;
}

async function getExistingColumns(tableName: string, schemaName: string) {
  const [rows] = (await db.execute(
    sql.raw(
      `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${schemaName.replace(/'/g, "''")}' AND TABLE_NAME = '${tableName.replace(/'/g, "''")}'`
    )
  )) as any;
  return new Set((rows as any[]).map((r) => String(r.name)));
}

async function main() {
  const schemaName = process.env.MYSQL_DATABASE;
  if (!schemaName) throw new Error("MYSQL_DATABASE is required");

  console.log("Adding archive columns to dynamic client tables...");

  ({ db } = await import("../lib/modules/core/db/mysql"));
  const { clients } = await import("../lib/modules/core/db/schema");

  const allClients = await db.select().from(clients);

  for (const client of allClients) {
    const tableName = (client as any).tableName as string | null;
    if (!tableName) continue;

    const exists = await tableExists(tableName);
    if (!exists) {
      console.log(`Skipping missing table: ${tableName}`);
      continue;
    }

    const columns = await getExistingColumns(tableName, schemaName);
    const alterParts: string[] = [];

    for (const col of requiredColumns) {
      if (!columns.has(col.name)) {
        alterParts.push(`ADD COLUMN ${escapeIdent(col.name)} ${col.ddl}`);
      }
    }

    if (alterParts.length === 0) {
      console.log(`OK ${tableName}: already up to date`);
      continue;
    }

    const alterSql = `ALTER TABLE ${escapeIdent(tableName)} ${alterParts.join(", ")}`;
    console.log(`Applying ${tableName}: ${alterParts.length} change(s)`);
    await db.execute(sql.raw(alterSql));
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

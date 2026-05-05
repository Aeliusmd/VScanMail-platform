import "dotenv/config";
import { db } from "../lib/modules/core/db/mysql";
import { clients } from "../lib/modules/core/db/schema";
import { sql } from "drizzle-orm";

const TARGET_CHARSET = "utf8mb4";
const TARGET_COLLATION = "utf8mb4_unicode_ci";

function quoteIdent(name: string): string {
  return `\`${String(name).replace(/`/g, "``")}\``;
}

async function run() {
  console.log(`Normalizing org tables to ${TARGET_CHARSET}/${TARGET_COLLATION}...`);

  const allClients = await db.select({ tableName: clients.tableName }).from(clients);
  const [tablesRaw] = (await db.execute(sql`SHOW TABLES`)) as any;
  const existingTables = new Set<string>((tablesRaw as any[]).map((row) => String(Object.values(row)[0])));

  const orgTables = allClients
    .map((c) => c.tableName)
    .filter((t): t is string => Boolean(t) && existingTables.has(t));

  if (!orgTables.length) {
    console.log("No existing org tables found. Nothing to normalize.");
    return;
  }

  const failures: Array<{ table: string; error: string }> = [];
  let successCount = 0;

  for (const tableName of orgTables) {
    const q = `ALTER TABLE ${quoteIdent(tableName)} CONVERT TO CHARACTER SET ${TARGET_CHARSET} COLLATE ${TARGET_COLLATION}`;
    try {
      await db.execute(sql.raw(q));
      successCount += 1;
      console.log(`OK ${tableName}`);
    } catch (error: any) {
      const message = error?.message || String(error);
      failures.push({ table: tableName, error: message });
      console.error(`FAIL ${tableName}: ${message}`);
    }
  }

  console.log(`Done. Success: ${successCount}/${orgTables.length}`);

  if (failures.length) {
    console.error("Failed tables:");
    for (const failure of failures) {
      console.error(`- ${failure.table}: ${failure.error}`);
    }
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("Normalization failed:", error);
  process.exit(1);
});

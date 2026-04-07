import { db } from "./lib/modules/core/db/mysql";
import { sql } from "drizzle-orm";

async function listTables() {
  const result = await db.execute(sql.raw("SHOW TABLES"));
  console.log("Tables in database:");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

listTables().catch((err) => {
  console.error(err);
  process.exit(1);
});

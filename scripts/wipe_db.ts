import { db, sql } from "../lib/modules/core/db/mysql";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { users, profiles } from "../lib/modules/core/db/schema";

async function main() {
  console.log("Starting full database wipe for fresh testing...");

  try {
    // Drop all tables
    console.log("Dropping all application tables...");
    const [tables] = await db.execute(sql`SHOW TABLES`) as any;
    
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    for (const row of tables) {
      const tableName = Object.values(row)[0] as string;
      await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
      console.log(`- Dropped ${tableName}`);
    }
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    console.log("✅ Database tables successfully dropped. Ready for schema push.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Wipe failed:", error);
    process.exit(1);
  }
}

main();

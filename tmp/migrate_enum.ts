import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";

async function migrateExistingTables() {
  console.log("Starting ENUM migration for existing organization tables...");
  
  try {
    const allClients = await db.select().from(clients);
    
    for (const client of allClients) {
      const tableName = client.tableName;
      console.log(`Migrating table: ${tableName}`);
      
      try {
        await db.execute(sql.raw(`
          ALTER TABLE \`${tableName}\` 
          MODIFY COLUMN \`ai_risk_level\` ENUM('none','low','medium','high','critical') NULL;
        `));
        console.log(`Successfully migrated ${tableName}`);
      } catch (err: any) {
        console.error(`Failed to migrate ${tableName}: ${err.message}`);
      }
    }
    
    console.log("Migration complete.");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration fatal error:", err);
    process.exit(1);
  }
}

migrateExistingTables();

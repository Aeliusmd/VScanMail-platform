import { db } from "../lib/modules/core/db/mysql";
import { clients } from "../lib/modules/core/db/schema";
import { createClientTable } from "../lib/modules/core/db/dynamic-table";
import { sql } from "drizzle-orm";

async function repair() {
  console.log("Starting Database Repair...");
  
  // 1. Get all clients from DB
  const allClients = await db.select().from(clients);
  console.log(`Found ${allClients.length} clients in system.`);

  // 2. Get list of existing tables
  const [tablesResult] = await db.execute(sql.raw("SHOW TABLES"));
  const existingTables = ((tablesResult as unknown) as any[]).map(row => Object.values(row)[0] as string);
  console.log(`System has ${existingTables.length} tables total.`);

  // 3. Compare and Create
  for (const client of allClients) {
    if (!client.tableName) {
      console.warn(`Client ${client.companyName} has NO table_name defined! skipping...`);
      continue;
    }

    if (existingTables.includes(client.tableName)) {
      console.log(`✅ Table ${client.tableName} already exists for ${client.companyName}.`);
    } else {
      console.log(`🚀 Creating missing table ${client.tableName} for ${client.companyName}...`);
      try {
        await createClientTable(client.tableName);
        console.log(`Successfully created ${client.tableName}.`);
      } catch (err: any) {
        console.error(`Error creating table for ${client.companyName}:`, err.message);
      }
    }
  }

  console.log("Repair finished.");
  process.exit(0);
}

repair().catch(err => {
  console.error("Repair failed:", err);
  process.exit(1);
});

import "dotenv/config";
import { db } from "./lib/db/mysql";
import { clients, companyDirectory } from "./lib/db/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";

async function backfill() {
  console.log("Fetching existing clients...");
  const existingClients = await db.select().from(clients);
  console.log(`Found ${existingClients.length} existing clients.`);

  let added = 0;
  for (const client of existingClients) {
    try {
      await db.insert(companyDirectory).values({
        id: crypto.randomUUID(),
        sourceType: "client",
        sourceId: client.id,
        companyName: client.companyName,
        email: client.email,
        industry: client.industry,
        phone: client.phone,
        status: client.status,
        createdAt: client.createdAt || sql`NOW()`,
      });
      added++;
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`Skipped duplicate for email: ${client.email}`);
      } else {
        console.error(`Error inserting ${client.email}:`, err);
      }
    }
  }

  console.log(`Backfill complete. Added ${added} old clients to company_directory.`);
  process.exit(0);
}

backfill().catch(console.error);

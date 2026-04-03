import "dotenv/config";
import { db } from './lib/modules/core/db/mysql';
import { auditLogs } from './lib/modules/core/db/schema';
import { desc } from 'drizzle-orm';

async function checkLogs() {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5);
    console.log("Found logs:", JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Failed to fetch logs:", err);
  } finally {
    process.exit(0);
  }
}

checkLogs();

import "dotenv/config";
import { db } from './lib/modules/core/db/mysql';
import { auditLogs, users, clients } from './lib/modules/core/db/schema';
import { desc, eq } from 'drizzle-orm';

async function checkLogs() {
  try {
    const rows = await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      firstName: users.firstName,
      lastName: users.lastName,
      companyName: clients.companyName,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .leftJoin(clients, eq(auditLogs.clientId, clients.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

    const mapped = rows.map(r => ({
      ...r,
      actorName: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'System'
    }));

    console.log("Found logs (mapped):", JSON.stringify(mapped, null, 2));
  } catch (err) {
    console.error("Failed to fetch logs:", err);
  } finally {
    process.exit(0);
  }
}

checkLogs();

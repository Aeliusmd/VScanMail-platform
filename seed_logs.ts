import "dotenv/config";
import { db } from './lib/modules/core/db/mysql';
import { auditLogs, users } from './lib/modules/core/db/schema';
import crypto from 'crypto';

async function seed() {
  try {
    const userRows = await db.select({ id: users.id }).from(users).limit(1);
    if (!userRows[0]) {
      console.log("No users found to act as actor.");
      return;
    }
    const actorId = userRows[0].id;

    await db.insert(auditLogs).values([
      {
        id: crypto.randomUUID(),
        actorId,
        actorRole: 'super_admin',
        action: 'System initialized and connected to database',
        entityType: 'system',
        entityId: '0',
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        actorId,
        actorRole: 'super_admin',
        action: 'Activity Log module updated to real-time sync',
        entityType: 'admin_settings',
        entityId: 'settings_01',
        createdAt: new Date(),
      }
    ]);
    console.log("Seed logs created successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();

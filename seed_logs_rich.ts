import "dotenv/config";
import { db } from './lib/modules/core/db/mysql';
import { auditLogs, users } from './lib/modules/core/db/schema';
import crypto from 'crypto';

async function seed() {
  try {
    const userRows = await db.select({ id: users.id, email: users.email }).from(users).limit(1);
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
        action: 'Updated admin "Emily Walsh" status to Active',
        entityType: 'admin',
        entityId: 'dummy_admin_id',
        beforeState: { status: 'inactive', role: 'admin', email: 'emily@vscanmail.com' },
        afterState: { status: 'active', role: 'admin', email: 'emily@vscanmail.com' },
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        actorId,
        actorRole: 'super_admin',
        action: 'Modified company "Apex Logistics" contact details',
        entityType: 'company',
        entityId: 'dummy_company_id',
        beforeState: { company_name: 'Apex', phone: '555-0100', industry: 'Logistics' },
        afterState: { company_name: 'Apex Logistics', phone: '555-0200', industry: 'Global Logistics' },
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        createdAt: new Date(),
      }
    ]);
    console.log("Rich seed logs created successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();

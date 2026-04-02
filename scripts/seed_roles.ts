import { db } from "../lib/modules/core/db/mysql";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { users, profiles, clients, subscriptions } from "../lib/modules/core/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    const now = new Date();
    const testEmails = ["admin@vscanmail.com", "operator@vscanmail.com", "cop@vscanmail.com"];

    console.log("Cleaning up existing test accounts...");
    for (const email of testEmails) {
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        const userId = existingUser[0].id;
        // Profile handles its own deletion if we have FK cascade, but let's be explicit
        await db.execute(sql.raw(`DELETE FROM profiles WHERE user_id = '${userId}'`));
        await db.execute(sql.raw(`DELETE FROM users WHERE id = '${userId}'`));
      }
    }
    
    // Also cleanup the dummy client
    await db.execute(sql.raw(`DELETE FROM subscriptions WHERE client_id IN (SELECT id FROM clients WHERE client_code = 'QA001')`));
    await db.execute(sql.raw(`DELETE FROM clients WHERE client_code = 'QA001'`));

    // 1. Super Admin
    console.log("Seeding Super Admin...");
    const superAdminId = crypto.randomUUID();
    await db.insert(users).values({
      id: superAdminId,
      email: "admin@vscanmail.com",
      passwordHash: hash,
      isActive: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    });
    await db.insert(profiles).values({
      id: crypto.randomUUID(),
      userId: superAdminId,
      role: "super_admin",
      createdAt: now,
      updatedAt: now
    });

    // 2. Admin (Operator)
    console.log("Seeding Admin (Operator)...");
    const adminId = crypto.randomUUID();
    await db.insert(users).values({
      id: adminId,
      email: "operator@vscanmail.com",
      passwordHash: hash,
      isActive: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    });
    await db.insert(profiles).values({
      id: crypto.randomUUID(),
      userId: adminId,
      role: "admin",
      createdAt: now,
      updatedAt: now
    });

    // 3. Client
    console.log("Seeding Client (QA Company)...");
    const clientId = crypto.randomUUID();
    const clientUserId = crypto.randomUUID();
    
    // Create the organization first
    await db.insert(clients).values({
      id: clientId,
      clientCode: "QA001",
      tableName: "org_qa001_records",
      companyName: "QA Testing Corp",
      industry: "Technology",
      email: "cop@vscanmail.com",
      phone: "123-456-7890",
      addressJson: JSON.stringify({ street: "123 Test Ave", city: "QA Town" }),
      status: "active",
      createdAt: now,
      updatedAt: now
    });

    // Create the subscriber user
    await db.insert(users).values({
      id: clientUserId,
      email: "cop@vscanmail.com",
      passwordHash: hash,
      isActive: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    });
    
    // Link user to client via profile
    await db.insert(profiles).values({
      id: crypto.randomUUID(),
      userId: clientUserId,
      role: "client",
      clientId: clientId,
      createdAt: now,
      updatedAt: now
    });

    // Add a default subscription so the UI works
    await db.insert(subscriptions).values({
      id: crypto.randomUUID(),
      clientId: clientId,
      planTier: "starter",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
      createdAt: now,
      updatedAt: now
    });

    // Dynamic table creation for the client (if possible via SQL)
    console.log("Creating dynamic table for QA001...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS \`org_qa001_records\` (
        id VARCHAR(36) PRIMARY KEY,
        type ENUM('mail', 'cheque') NOT NULL,
        status VARCHAR(32) NOT NULL,
        metadata JSON,
        s3_key VARCHAR(512),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `));

    console.log(`
✅ SEEDING COMPLETE!

1. Super Admin: admin@vscanmail.com | password123
2. Admin:       operator@vscanmail.com | password123
3. Client:      cop@vscanmail.com | password123
    `);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

// Special helper for raw SQL used inside a string, though we import db from mysql which exports sql
import { sql } from "../lib/modules/core/db/mysql";

main();

import { db } from "../lib/modules/core/db/mysql";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { users, profiles } from "../lib/modules/core/db/schema";

async function main() {
  try {
    console.log("Seeding an Admin account...");
    const adminId = crypto.randomUUID();
    const superProfileId = crypto.randomUUID();
    const hash = await bcrypt.hash("password123", 10);

    await db.insert(users).values({
      id: adminId,
      email: "admin@vscanmail.com",
      passwordHash: hash,
      isActive: true,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.insert(profiles).values({
      id: superProfileId,
      userId: adminId,
      role: "super_admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Admin created! Email: admin@vscanmail.com | Password: password123`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();

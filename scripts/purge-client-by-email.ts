import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { db, sql } from "../lib/modules/core/db/mysql";
import {
  users,
  profiles,
  clients,
  emailVerifications,
  passwordResets,
  subscriptions,
  usageEvents,
  clientNotificationPreferences,
  clientBankAccounts,
  deliveryAddresses,
  manualPayments,
  auditLogs,
} from "../lib/modules/core/db/schema";
import { eq, inArray, or } from "drizzle-orm";

async function purgeClientByEmail(email: string) {
  console.log(`\nLooking up data for: ${email}`);

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  const clientByEmailRows = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  const clientByUserRows = user
    ? await db.select().from(clients).where(eq(clients.id, user.id)).limit(1)
    : [];
  const client = clientByEmailRows[0] || clientByUserRows[0];
  const tableName = client?.tableName;
  const clientId = client?.id;

  if (user) console.log(`Found user ID: ${user.id}`);
  if (client) {
    console.log(`Found client: ${client.companyName} (table: ${tableName})`);
  } else {
    console.log("No client record found for this user.");
  }

  if (!user && !client) {
    console.log("No matching user or client found. Nothing to delete.");
    return;
  }

  const profileRows = clientId
    ? await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.clientId, clientId))
    : [];
  const userIds = Array.from(
    new Set([user?.id, clientId, ...profileRows.map((p) => p.userId)].filter(Boolean) as string[])
  );

  console.log("\nDeleting all related records...");

  await db.transaction(async (tx) => {
    await tx.delete(emailVerifications).where(eq(emailVerifications.email, email));
    console.log("  ✓ email_verifications");

    if (userIds.length > 0) {
      await tx.delete(passwordResets).where(inArray(passwordResets.userId, userIds));
      console.log("  ✓ password_resets");
    }

    if (clientId) {
      await tx.delete(usageEvents).where(eq(usageEvents.clientId, clientId));
      console.log("  ✓ usage_events");

      await tx.delete(clientNotificationPreferences).where(eq(clientNotificationPreferences.clientId, clientId));
      console.log("  ✓ client_notification_preferences");

      await tx.delete(clientBankAccounts).where(eq(clientBankAccounts.clientId, clientId));
      console.log("  ✓ client_bank_accounts");

      await tx.delete(deliveryAddresses).where(eq(deliveryAddresses.clientId, clientId));
      console.log("  ✓ delivery_addresses");

      await tx.delete(manualPayments).where(eq(manualPayments.clientId, clientId));
      console.log("  ✓ manual_payments");

      await tx.delete(subscriptions).where(eq(subscriptions.clientId, clientId));
      console.log("  ✓ subscriptions");

      await tx.delete(auditLogs).where(eq(auditLogs.clientId, clientId));
      console.log("  ✓ audit_logs");

      await tx.delete(clients).where(eq(clients.id, clientId));
      console.log("  ✓ clients");
    }

    if (userIds.length > 0 && clientId) {
      await tx.delete(profiles).where(or(eq(profiles.clientId, clientId), inArray(profiles.userId, userIds)));
      console.log("  ✓ profiles");
    } else if (userIds.length > 0) {
      await tx.delete(profiles).where(inArray(profiles.userId, userIds));
      console.log("  ✓ profiles");
    }

    if (userIds.length > 0) {
      await tx.delete(users).where(inArray(users.id, userIds));
      console.log("  ✓ users");
    }
  });

  if (tableName) {
    console.log(`\nDropping dynamic table: ${tableName}`);
    await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
    console.log(`  ✓ ${tableName} dropped`);
  }

  console.log(`\n✅ Purge complete. "${email}" can now register a new organization.`);
}

const emailArgs = process.argv.slice(2);
if (emailArgs.length === 0) {
  console.error("Usage: npx tsx scripts/purge-client-by-email.ts <email> [email...]");
  process.exit(1);
}

Promise.all(emailArgs.map((email) => purgeClientByEmail(email))).catch((err) => {
  console.error("\n❌ Purge failed:", err);
  process.exit(1);
});

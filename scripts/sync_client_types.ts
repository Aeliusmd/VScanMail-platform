import { db } from "../lib/modules/core/db/mysql";
import { clients, manualPayments } from "../lib/modules/core/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("Starting Client Type Sync...");

  // 1. Find all client IDs that have at least one manual payment
  const payments = await db.select({ clientId: manualPayments.clientId }).from(manualPayments);
  const clientIdsWithManualPlans = Array.from(new Set(payments.map((p: any) => p.clientId)));

  if (clientIdsWithManualPlans.length === 0) {
    console.log("No manual payments found. Nothing to sync.");
    return;
  }

  // 2. Update all those clients to 'manual' type
  await db.update(clients)
    .set({ clientType: 'manual' })
    .where(inArray(clients.id, clientIdsWithManualPlans));

  console.log(`Successfully synced ${clientIdsWithManualPlans.length} companies to 'MANUAL' type.`);
}

main()
  .then(() => {
    console.log("Sync Complete.");
    process.exit(0);
  })
  .catch((e) => {
    console.log("Sync Failed:", e);
    process.exit(1);
  });

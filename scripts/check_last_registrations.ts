import { db } from "./lib/modules/core/db/mysql";
import { clients, users } from "./lib/modules/core/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("Checking last 5 clients...");
  const recentClients = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(5);
  console.log("Recent Clients:", JSON.stringify(recentClients, null, 2));

  console.log("Checking last 5 users...");
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
  console.log("Recent Users:", JSON.stringify(recentUsers, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

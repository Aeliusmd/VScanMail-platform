import { db } from "./lib/modules/core/db/mysql";
import { clients } from "./lib/modules/core/db/schema";

async function check() {
  const all = await db.select().from(clients);
  console.log("Clients count:", all.length);
  all.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.company_name}, Table: ${c.tableName}`);
  });
  
  const tableNames = all.map(c => c.tableName);
  const duplicates = tableNames.filter((item, index) => tableNames.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.log("DUPLICATE TABLE NAMES DETECTED:", duplicates);
  } else {
    console.log("No duplicate table names found.");
  }
  process.exit(0);
}

check();

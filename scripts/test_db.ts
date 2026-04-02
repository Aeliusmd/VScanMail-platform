import { db, sql } from "../lib/db/mysql";

async function main() {
  try {
    const [cd] = await db.execute(sql.raw(`DESCRIBE company_directory`)) as any;
    console.log("CD COLS:", cd.map((c: any) => c.Field));
    
    const [mac] = await db.execute(sql.raw(`DESCRIBE manually_added_clients`)) as any;
    console.log("MAC COLS:", mac.map((c: any) => c.Field));
  } catch (err: any) {
    console.error("TEST ERROR:", err.message);
  }
}

main().then(() => process.exit(0));

import { db, sql } from './lib/modules/core/db/mysql';

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log("Connection successful:", result);
    const tables = await db.execute(sql`SHOW TABLES`);
    console.log("Tables:", tables);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    process.exit(0);
  }
}

testConnection();

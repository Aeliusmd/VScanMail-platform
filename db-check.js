const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute("SELECT id, company_name, tableName FROM clients");
  console.log("Clients in DB:", rows);
  
  const tables = rows.map(r => r.tableName);
  const dups = tables.filter((t, i) => tables.indexOf(t) !== i);
  if (dups.length > 0) {
    console.log("DUPLICATE TABLES DETECTED:", dups);
  }
  await connection.end();
}

check().catch(console.error);

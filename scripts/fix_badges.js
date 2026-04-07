const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  console.log("Starting Manual Fix...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vscanmail',
  });

  try {
    const [rows] = await connection.execute(
      "UPDATE clients SET client_type = 'manual' WHERE id IN (SELECT DISTINCT client_id FROM manual_payments)"
    );
    console.log(`Success! Updated ${rows.changedRows} companies.`);
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await connection.end();
  }
}

main();

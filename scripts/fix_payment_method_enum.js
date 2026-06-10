const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306)
  });
  try {
    const sql = "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='manual_payments' AND COLUMN_NAME='payment_method' AND COLUMN_TYPE LIKE '%card%'";
    const [rows] = await conn.execute(sql);
    if (rows[0].cnt > 0) {
      console.log("'card' already in enum — no change needed");
      return;
    }
    await conn.execute("ALTER TABLE manual_payments MODIFY COLUMN payment_method ENUM('cash','bank_transfer','cheque','other','card') NOT NULL DEFAULT 'other'");
    console.log("ALTER TABLE OK — 'card' added to payment_method enum");
  } finally {
    await conn.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });

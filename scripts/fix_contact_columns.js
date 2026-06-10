const mysql = require('mysql2/promise');

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?",
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306)
  });
  try {
    if (await columnExists(conn, 'clients', 'contact_name')) {
      console.log("'contact_name' already exists — skipping");
    } else {
      await conn.execute("ALTER TABLE `clients` ADD COLUMN `contact_name` varchar(255) NULL");
      console.log("Added 'contact_name' to clients");
    }

    if (await columnExists(conn, 'clients', 'contact_email')) {
      console.log("'contact_email' already exists — skipping");
    } else {
      await conn.execute("ALTER TABLE `clients` ADD COLUMN `contact_email` varchar(255) NULL");
      console.log("Added 'contact_email' to clients");
    }
  } finally {
    await conn.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });

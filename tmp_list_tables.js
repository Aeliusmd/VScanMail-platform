const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function listTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306')
  });

  try {
    const [rows] = await connection.query('SHOW TABLES');
    console.log('--- DATABASE TABLES ---');
    rows.forEach(row => {
      console.log(Object.values(row)[0]);
    });
    console.log('-----------------------');
  } catch (err) {
    console.error('Error listing tables:', err.message);
  } finally {
    await connection.end();
  }
}

listTables();

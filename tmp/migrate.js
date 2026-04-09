const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'vscanmail',
    password: 'vscanmail',
    database: 'vscanmail',
    port: 3306
  });

  console.log('Connected to MySQL.');

  try {
    const [clients] = await connection.execute('SELECT table_name FROM clients');
    for (const client of clients) {
      const tableName = client.table_name;
      const sql = `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`ai_risk_level\` ENUM('none','low','medium','high','critical') NULL`;
      console.log(`Executing: ${sql}`);
      try {
        await connection.execute(sql);
        console.log(`Success for ${tableName}`);
      } catch (err) {
        console.error(`Error for ${tableName}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await connection.end();
  }
}

run();

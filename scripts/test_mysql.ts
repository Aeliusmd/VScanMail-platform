import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    const [rows] = await conn.execute(`
      INSERT INTO clients (
        id, client_code, table_name, company_name, industry, email, phone, address_json,
        client_type, status, two_fa_enabled, created_at, updated_at
      )
      VALUES (
        '56c86ad0-7de2-4a03-a103-20a27b8494d7', 'VSM-BWXT_', 'org_vsmbwxt_records', 'Soleno AI', 'Manufacturing', 
        'bestlost3@gmail.com', '0779485361', '{"street":"372 Galle Rd, Colombo 00300","city":"","state":"","zip":"","country":""}', 
        'manual', 'active', false, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        industry = VALUES(industry),
        email = VALUES(email),
        phone = VALUES(phone),
        address_json = VALUES(address_json),
        client_type = 'manual',
        status = VALUES(status),
        updated_at = NOW()
    `);
    console.log("SUCCESS", rows);
  } catch (err: any) {
    console.log("NATIVE MYSQL ERROR:");
    console.log(err.message);
  }
  await conn.end();
}

main().catch(console.error);

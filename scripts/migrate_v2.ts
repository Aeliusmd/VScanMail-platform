import { db, sql } from "../lib/db/mysql";
import { createClientTable } from "../lib/db/dynamic-table";
import { generateClientCode, generateClientTableName } from "../lib/utils/client-code";

async function main() {
  console.log("Starting V2 Migration...");

  console.log("Applying preliminary schema changes...");
  await db.execute(sql.raw(`ALTER TABLE profiles MODIFY COLUMN role ENUM('client', 'operator', 'admin', 'super_admin') NOT NULL DEFAULT 'client'`));
  
  // Add columns to clients if they don't exist
  try {
    await db.execute(sql.raw(`ALTER TABLE clients ADD COLUMN client_type ENUM('subscription', 'manual') DEFAULT 'subscription'`));
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql.raw(`ALTER TABLE clients ADD COLUMN table_name VARCHAR(255)`));
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql.raw(`ALTER TABLE clients ADD COLUMN added_by VARCHAR(36)`));
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql.raw(`ALTER TABLE clients ADD COLUMN updated_at DATETIME`));
  } catch (e) { /* ignore if exists */ }
  try {
    // If we inserted NULLs previously due to missing columns, just in case
    await db.execute(sql.raw(`UPDATE clients SET updated_at = NOW() WHERE updated_at IS NULL`));
  } catch (e) { /* ignore */ }

  // 1. Upgrade aeliusoffice3@gmail.com to super_admin
  console.log("Upgrading admin account to super_admin...");
  const [adminUser] = await db.execute(sql`SELECT id FROM users WHERE email = 'aeliusoffice3@gmail.com' LIMIT 1`) as any;
  if (adminUser?.[0]) {
    await db.execute(sql`UPDATE profiles SET role = 'super_admin' WHERE user_id = ${adminUser[0].id}`);
    console.log("-> Upgraded aeliusoffice3@gmail.com successfully.");
  } else {
    console.log("-> aeliusoffice3@gmail.com not found. Skipping upgrade.");
  }

  // 2. Fetch all existing manual clients directly from MySQL since the ORM schema has changed
  console.log("Migrating manual clients into unified clients table...");
  const [manualClients] = await db.execute(sql`
    SELECT mac.id, cd.company_name, cd.industry, cd.email, cd.phone, mac.address_text as address, cd.status, mac.notes
    FROM manually_added_clients mac
    LEFT JOIN company_directory cd ON mac.directory_id = cd.id
  `) as any;

  for (const client of manualClients) {
    const clientCode = generateClientCode();
    const tableName = generateClientTableName(clientCode);
    console.log(`-> Migrating manual client ${client.company_name} -> ${tableName}`);
    
    const addressJson = JSON.stringify({ street: client.address || "", city: "", state: "", zip: "", country: "" });
    
    // Insert into 'clients'
    await db.execute(sql`
      INSERT INTO clients (
        id, client_code, table_name, company_name, industry, email, phone, address_json,
        client_type, status, two_fa_enabled, created_at, updated_at
      )
      VALUES (
        ${client.id}, ${clientCode}, ${tableName}, ${client.company_name}, ${client.industry || "general"},
        ${client.email || ""}, ${client.phone || ""}, ${addressJson}, 'manual', ${client.status || "active"},
        false, NOW(), NOW()
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

    // Initialize dynamic table
    await createClientTable(tableName);
  }

  // 3. Ensure existing 'subscription' clients have table_names initialized
  console.log("Checking existing subscription clients...");
  const [subs] = await db.execute(sql`SELECT id, company_name, email FROM clients WHERE client_type = 'subscription' AND table_name IS NULL`) as any;
  for (const sub of subs) {
    const clientCode = generateClientCode();
    const tableName = generateClientTableName(clientCode);
    console.log(`-> Initializing table for subscription client ${sub.company_name} -> ${tableName}`);
    
    await db.execute(sql`UPDATE clients SET client_code = ${clientCode}, table_name = ${tableName} WHERE id = ${sub.id}`);
    await createClientTable(tableName);
  }
  
  // 4. Also check older users that were in 'clients' but don't have client_type in case
  console.log("Checking legacy clients...");
  await db.execute(sql`UPDATE clients SET client_type = 'subscription' WHERE client_type IS NULL`);

  // 5. Drop deprecated tables if user requested (they did confirm 'Yes then Do it')
  console.log("Dropping deprecated V1 tables (mail_items, cheques, manually_added_clients, etc)...");
  const deprecatedTables = [
    "mail_items", "cheques", "deposit_batches", "invoices", "company_directory", "manually_added_clients"
  ];

  for (const table of deprecatedTables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${table}\``));
      console.log(`-> Dropped table ${table}`);
    } catch (err: any) {
      console.log(`-> Failed to drop ${table}: ${err.message}`);
    }
  }

  console.log("V2 Migration Completed Successfully!");
  process.exit(0);
}

import fs from "fs";

main().catch((err: any) => {
  console.error(err);
  const log = {
    message: err.message,
    sqlMessage: err.sqlMessage || err.message,
    sqlState: err.sqlState,
    code: err.code
  };
  fs.writeFileSync("error_log.txt", JSON.stringify(log, null, 2));
  process.exit(1);
});

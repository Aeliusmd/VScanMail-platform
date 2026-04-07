const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const createTableSql = (tableName) => `
    CREATE TABLE \`${tableName}\` (
      \`id\`                         VARCHAR(36)  NOT NULL,
      \`irn\`                        VARCHAR(128) NOT NULL,
      \`record_type\`                 ENUM('letter','cheque','package','legal') NOT NULL,
      \`envelope_front_url\`          TEXT         NOT NULL,
      \`envelope_back_url\`           TEXT         NOT NULL,
      \`content_scan_urls\`           JSON         NOT NULL,
      \`tamper_detected\`             BOOLEAN      NOT NULL DEFAULT FALSE,
      \`tamper_annotations\`          JSON         NULL,
      \`ocr_text\`                    TEXT         NULL,
      \`ai_summary\`                  TEXT         NULL,
      \`ai_actions\`                  JSON         NULL,
      \`ai_risk_level\`               ENUM('low','medium','high','critical') NULL,
      \`retention_until\`             DATETIME     NOT NULL,
      \`scanned_by\`                  VARCHAR(36)  NOT NULL,
      \`scanned_at\`                  DATETIME     NOT NULL,
      \`mail_status\`                 ENUM('received','scanned','processed','delivered') NOT NULL DEFAULT 'received',
      \`cheque_amount_figures\`       DECIMAL(12,2) NULL,
      \`cheque_amount_words\`         VARCHAR(255)  NULL,
      \`cheque_amounts_match\`        BOOLEAN       NULL,
      \`cheque_date_on_cheque\`       VARCHAR(64)   NULL,
      \`cheque_date_valid\`           BOOLEAN       NULL,
      \`cheque_beneficiary\`          VARCHAR(255)  NULL,
      \`cheque_beneficiary_match\`    DECIMAL(6,4)  NULL,
      \`cheque_signature_present\`    BOOLEAN       NULL,
      \`cheque_alteration_detected\`  BOOLEAN       NULL,
      \`cheque_crossing_present\`     BOOLEAN       NULL,
      \`cheque_ai_confidence\`        DECIMAL(6,4)  NULL,
      \`cheque_ai_raw_result\`        JSON          NULL,
      \`cheque_decision\`             ENUM('pending','approved','rejected') NULL,
      \`cheque_decided_by\`           VARCHAR(36)   NULL,
      \`cheque_decided_at\`           DATETIME      NULL,
      \`cheque_status\`               ENUM('validated','flagged','approved','cleared') NULL,
      \`created_at\`                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`irn_uq\`            (\`irn\`),
      KEY \`record_type_idx\`          (\`record_type\`),
      KEY \`mail_status_idx\`          (\`mail_status\`),
      KEY \`scanned_at_idx\`           (\`scanned_at\`),
      KEY \`risk_level_idx\`           (\`ai_risk_level\`),
      KEY \`cheque_decision_idx\`      (\`cheque_decision\`),
      KEY \`cheque_status_idx\`        (\`cheque_status\`),
      KEY \`created_at_idx\`           (\`created_at\`)
    )
`;

async function repair() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306')
  });

  try {
    console.log('Fetching clients...');
    const [clients] = await connection.query('SELECT company_name, table_name FROM clients');
    
    const [tableRows] = await connection.query('SHOW TABLES');
    const existingTables = tableRows.map(row => Object.values(row)[0]);

    for (const client of clients) {
      const tableName = client.table_name;
      if (!tableName) continue;

      if (existingTables.includes(tableName)) {
        console.log(`✅ Table ${tableName} exists for ${client.company_name}`);
      } else {
        console.log(`🚀 Creating missing table ${tableName} for ${client.company_name}...`);
        await connection.query(createTableSql(tableName));
        console.log(`Successfully created ${tableName}`);
      }
    }
  } catch (err) {
    console.error('Repair Error:', err.message);
  } finally {
    await connection.end();
  }
}

repair();

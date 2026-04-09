import { sql } from "drizzle-orm";
import { db } from "./mysql";
import { clients } from "./schema";
import { eq } from "drizzle-orm";

export async function createClientTable(tableName: string) {
  await db.execute(sql.raw(`
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
      \`ai_risk_level\`               ENUM('none','low','medium','high','critical') NULL,

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
  `));
}

export async function dropClientTable(tableName: string) {
  await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
}

export async function getClientTableName(clientId: string): Promise<string> {
  const [client] = await db
    .select({ tableName: clients.tableName })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
    
  if (!client) throw new Error("Client not found");
  return client.tableName;
}

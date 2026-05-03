import { eq } from "drizzle-orm";
import { db, sql } from "../core/db/mysql";
import { customerHiddenRecords } from "../core/db/schema";

// Auto-create the table on first use so this works before drizzle-kit push is run.
let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`customer_hidden_records\` (
      \`id\`        VARCHAR(36)  NOT NULL,
      \`client_id\` VARCHAR(36)  NOT NULL,
      \`record_id\` VARCHAR(36)  NOT NULL,
      \`hidden_at\` DATETIME     NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`chr_client_record_uq\` (\`client_id\`, \`record_id\`),
      KEY \`chr_client_idx\` (\`client_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `));
  tableEnsured = true;
}

export const customerHiddenModel = {
  /** Mark one or more records as hidden for a specific client. Idempotent. */
  async hide(clientId: string, recordIds: string[]): Promise<void> {
    await ensureTable();
    if (!recordIds.length) return;
    const now = new Date();
    for (const recordId of recordIds) {
      const id = crypto.randomUUID();
      await db
        .insert(customerHiddenRecords)
        .values({ id, clientId, recordId, hiddenAt: now })
        .onDuplicateKeyUpdate({ set: { hiddenAt: now } });
    }
  },

  /** Return the Set of record IDs this client has hidden. */
  async getHiddenIds(clientId: string): Promise<Set<string>> {
    await ensureTable();
    const rows = await db
      .select({ recordId: customerHiddenRecords.recordId })
      .from(customerHiddenRecords)
      .where(eq(customerHiddenRecords.clientId, clientId));
    return new Set(rows.map((r) => r.recordId));
  },

  /**
   * Remove all hidden-record entries for a given record.
   * Called when an admin permanently deletes the underlying record so
   * the soft-delete table stays clean.
   */
  async cleanupRecord(recordId: string): Promise<void> {
    await ensureTable();
    await db
      .delete(customerHiddenRecords)
      .where(eq(customerHiddenRecords.recordId, recordId));
  },
};

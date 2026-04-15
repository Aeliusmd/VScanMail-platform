import { auditService } from "../audit/audit.service";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { getClientTableName } from "@/lib/modules/core/db/dynamic-table";
import { clients } from "@/lib/modules/core/db/schema";

export type MailItem = {
  id: string;
  client_id: string;
  irn: string;
  type: "letter" | "cheque" | "package" | "legal";
  envelope_front_url: string;
  envelope_back_url: string;
  content_scan_urls: string[];
  tamper_detected: boolean;
  tamper_annotations: any;
  ocr_text: string | null;
  ai_summary: string | null;
  ai_actions: { action: string; deadline: string; priority: string }[] | null;
  ai_risk_level: "none" | "low" | "medium" | "high" | "critical" | null;
  retention_until: string;
  scanned_by: string;
  scanned_at: string;
  status: "received" | "scanned" | "processed" | "delivered";
  created_at: string;

  // Cheque Specific Fields
  cheque_amount_figures?: number | null;
  cheque_amount_words?: string | null;
  cheque_amounts_match?: boolean | null;
  cheque_date_on_cheque?: string | null;
  cheque_date_valid?: boolean | null;
  cheque_beneficiary?: string | null;
  cheque_beneficiary_match?: number | null;
  cheque_signature_present?: boolean | null;
  cheque_alteration_detected?: boolean | null;
  cheque_crossing_present?: boolean | null;
  cheque_ai_confidence?: number | null;
  cheque_ai_raw_result?: any | null;
  cheque_decision?: "pending" | "approved" | "rejected" | null;
  cheque_decided_by?: string | null;
  cheque_decided_at?: string | null;
  cheque_status?: "validated" | "flagged" | "approved" | "cleared" | null;
};

/** Formats a date for MySQL DATETIME columns (YYYY-MM-DD HH:MM:SS) */
function toSqlDatetime(date: string | Date | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: map MySQL raw row to MailItem
/** Safely convert a raw DB value to ISO string, returning null if value is absent */
function toISOSafe(value: any): string {
  if (!value) return new Date().toISOString();
  
  // If it's a string from MySQL DATETIME and doesn't have a suffix, append Z to force UTC interpretation
  let dateValue = value;
  if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+')) {
    dateValue = value.replace(' ', 'T') + 'Z';
  }
  
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Safely parse a JSON string, returning fallback on any error */
function parseJsonSafe(value: any, fallback: any = null): any {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function rowToMailItem(row: any, clientId: string): MailItem {
  return {
    id: row.id,
    client_id: clientId,
    irn: row.irn ?? '',
    type: row.record_type ?? 'letter',
    envelope_front_url: row.envelope_front_url ?? '',
    envelope_back_url: row.envelope_back_url ?? '',
    content_scan_urls: parseJsonSafe(row.content_scan_urls, []),
    tamper_detected: Boolean(row.tamper_detected),
    tamper_annotations: parseJsonSafe(row.tamper_annotations, null),
    ocr_text: row.ocr_text ?? null,
    ai_summary: row.ai_summary ?? null,
    ai_actions: parseJsonSafe(row.ai_actions, null),
    ai_risk_level: row.ai_risk_level ?? null,
    retention_until: toISOSafe(row.retention_until),
    scanned_by: row.scanned_by ?? '',
    scanned_at: toISOSafe(row.scanned_at),
    status: row.mail_status ?? 'received',
    created_at: toISOSafe(row.created_at),

    // Cheque Mappings
    cheque_amount_figures: row.cheque_amount_figures ? Number(row.cheque_amount_figures) : null,
    cheque_amount_words: row.cheque_amount_words ?? null,
    cheque_amounts_match: row.cheque_amounts_match !== null ? Boolean(row.cheque_amounts_match) : null,
    cheque_date_on_cheque: row.cheque_date_on_cheque ?? null,
    cheque_date_valid: row.cheque_date_valid !== null ? Boolean(row.cheque_date_valid) : null,
    cheque_beneficiary: row.cheque_beneficiary ?? null,
    cheque_beneficiary_match: row.cheque_beneficiary_match ? Number(row.cheque_beneficiary_match) : null,
    cheque_signature_present: row.cheque_signature_present !== null ? Boolean(row.cheque_signature_present) : null,
    cheque_alteration_detected: row.cheque_alteration_detected !== null ? Boolean(row.cheque_alteration_detected) : null,
    cheque_crossing_present: row.cheque_crossing_present !== null ? Boolean(row.cheque_crossing_present) : null,
    cheque_ai_confidence: row.cheque_ai_confidence ? Number(row.cheque_ai_confidence) : null,
    cheque_ai_raw_result: parseJsonSafe(row.cheque_ai_raw_result, null),
    cheque_decision: row.cheque_decision ?? null,
    cheque_decided_by: row.cheque_decided_by ?? null,
    cheque_decided_at: row.cheque_decided_at ? toISOSafe(row.cheque_decided_at) : null,
    cheque_status: row.cheque_status ?? null,
  };
}

async function locateRecordById(id: string) {
  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClients.length) return null;

  const queries = allClients.map(c => 
    sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id}`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);
  
  const [rows] = await db.execute(unionQuery) as any;
  return rows[0] || null;
}

export const mailItemModel = {
  async create(data: Partial<MailItem>, actorId?: string, req?: Request) {
    if (!data.client_id) throw new Error("client_id is required");
    const tableName = await getClientTableName(data.client_id);
    
    const id = data.id || crypto.randomUUID();
    const created = data.created_at ? new Date(data.created_at) : new Date();

    const query = sql`
      INSERT INTO ${sql.raw(`\`${tableName}\``)} (
        id, irn, record_type, envelope_front_url, envelope_back_url, content_scan_urls,
        tamper_detected, tamper_annotations, ocr_text, ai_summary, ai_actions, ai_risk_level,
        retention_until, scanned_by, scanned_at, mail_status, created_at,
        cheque_amount_figures, cheque_amount_words, cheque_amounts_match, cheque_date_on_cheque,
        cheque_date_valid, cheque_beneficiary, cheque_beneficiary_match, cheque_signature_present,
        cheque_alteration_detected, cheque_crossing_present, cheque_ai_confidence, cheque_ai_raw_result,
        cheque_decision, cheque_decided_by, cheque_decided_at, cheque_status
      ) VALUES (
        ${id}, 
        ${data.irn || ""}, 
        ${data.type || "letter"}, 
        ${data.envelope_front_url || ""}, 
        ${data.envelope_back_url || ""}, 
        ${JSON.stringify(data.content_scan_urls || [])},
        ${data.tamper_detected ? 1 : 0}, 
        ${data.tamper_annotations ? JSON.stringify(data.tamper_annotations) : null},
        ${data.ocr_text || null}, 
        ${data.ai_summary || null}, 
        ${data.ai_actions ? JSON.stringify(data.ai_actions) : null},
        ${data.ai_risk_level || null}, 
        ${toSqlDatetime(data.retention_until || Date.now())}, 
        ${data.scanned_by || ""}, 
        ${toSqlDatetime(data.scanned_at || Date.now())}, 
        ${data.status || 'scanned'}, 
        ${toSqlDatetime(created)},
        ${data.cheque_amount_figures ?? null},
        ${data.cheque_amount_words ?? null},
        ${data.cheque_amounts_match !== undefined ? (data.cheque_amounts_match ? 1 : 0) : null},
        ${data.cheque_date_on_cheque ?? null},
        ${data.cheque_date_valid !== undefined ? (data.cheque_date_valid ? 1 : 0) : null},
        ${data.cheque_beneficiary ?? null},
        ${data.cheque_beneficiary_match ?? null},
        ${data.cheque_signature_present !== undefined ? (data.cheque_signature_present ? 1 : 0) : null},
        ${data.cheque_alteration_detected !== undefined ? (data.cheque_alteration_detected ? 1 : 0) : null},
        ${data.cheque_crossing_present !== undefined ? (data.cheque_crossing_present ? 1 : 0) : null},
        ${data.cheque_ai_confidence ?? null},
        ${data.cheque_ai_raw_result ? JSON.stringify(data.cheque_ai_raw_result) : null},
        ${data.cheque_decision ?? null},
        ${data.cheque_decided_by ?? null},
        ${data.cheque_decided_at ? toSqlDatetime(data.cheque_decided_at) : null},
        ${data.cheque_status ?? null}
      )
    `;

    await db.execute(query);
    const item = await this.findById(id);

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin", // Matches db enum
        action: "record.created",
        entity: id,
        clientId: data.client_id,
        after: item,
        req,
      });
    }

    return item;
  },

  async findById(id: string) {
    const row = await locateRecordById(id);
    if (!row) throw new Error("Mail item not found");
    return rowToMailItem(row, row._client_id);
  },

  async listByClient(
    clientId: string,
    opts: { page?: number; limit?: number; type?: string; status?: string; archived?: boolean } = {}
  ) {
    const { page = 1, limit = 20, type, status, archived } = opts;
    const from = (page - 1) * limit;
    const tableName = await getClientTableName(clientId);

    const conditions = [];
    if (type) conditions.push(sql`record_type = ${type}`);
    if (status) conditions.push(sql`mail_status = ${status}`);
    if (archived !== undefined) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      conditions.push(
        archived ? sql`scanned_at < ${cutoff}` : sql`scanned_at >= ${cutoff}`
      );
    }

    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}` 
      : sql``;

    const query = sql`
      SELECT * FROM ${sql.raw(`\`${tableName}\``)}
      ${whereClause}
      ORDER BY scanned_at DESC
      LIMIT ${limit} OFFSET ${from}
    `;
    const [rows] = await db.execute(query) as any;

    const countQuery = sql`SELECT COUNT(*) as count FROM ${sql.raw(`\`${tableName}\``)} ${whereClause}`;
    const [countRows] = await db.execute(countQuery) as any;
    
    return {
      items: rows.map((r: any) => rowToMailItem(r, clientId)),
      total: Number(countRows[0]?.count || 0),
    };
  },

  async listAllGlobal(
    opts: { page?: number; limit?: number; type?: string; status?: string; archived?: boolean } = {}
  ) {
    const { page = 1, limit = 100, type, status, archived } = opts;
    const from = (page - 1) * limit;

    const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClientsRaw.length) return { items: [], total: 0 };

    // Check which tables actually exist to avoid querying missing tables
    const [tablesResult] = await db.execute(sql`SHOW TABLES`);
    const existingTableNames = new Set(((tablesResult as unknown) as any[]).map(row => Object.values(row)[0] as string));
    
    const allClients = allClientsRaw.filter(c => existingTableNames.has(c.tableName));
    if (!allClients.length) return { items: [], total: 0 };

    // Build WHERE clause conditions as raw strings
    const conditionParts: string[] = [];
    if (type) conditionParts.push(`record_type = '${type.replace(/'/g, "''")}'`);
    if (status) conditionParts.push(`mail_status = '${status.replace(/'/g, "''")}'`);
    if (archived !== undefined) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      conditionParts.push(
        archived ? `scanned_at < '${cutoff}'` : `scanned_at >= '${cutoff}'`
      );
    }
    const whereStr = conditionParts.length > 0 ? `WHERE ${conditionParts.join(' AND ')}` : '';

    // Deduplicate allClients based on tableName to avoid double-counting 
    // if multiple client entries point to the same table.
    const uniqueTables = Array.from(new Map(allClients.map(c => [c.tableName, c])).values());

    // Column list as a raw string — Drizzle sql template cannot embed sql fragments as column selectors
    const columnList = `
      id, irn, record_type, envelope_front_url, envelope_back_url, content_scan_urls, 
      tamper_detected, tamper_annotations, ai_actions, ocr_text, ai_summary, ai_risk_level, 
      retention_until, scanned_by, scanned_at, mail_status, created_at,
      cheque_amount_figures, cheque_amount_words, cheque_amounts_match, cheque_date_on_cheque,
      cheque_date_valid, cheque_beneficiary, cheque_beneficiary_match, cheque_signature_present,
      cheque_alteration_detected, cheque_crossing_present, cheque_ai_confidence, cheque_ai_raw_result,
      cheque_decision, cheque_decided_by, cheque_decided_at, cheque_status
    `.replace(/\s+/g, ' ').trim();

    // Build UNION ALL query as a plain SQL string
    const unionParts = uniqueTables.map(c => 
      `SELECT ${columnList}, '${c.id}' AS _client_id FROM \`${c.tableName}\` ${whereStr}`
    );
    const unionSql = unionParts.join(' UNION ALL ');

    try {
      const [rows] = await db.execute(sql.raw(`
        SELECT q.*, cl.company_name as _client_name 
        FROM (${unionSql}) q
        INNER JOIN \`clients\` cl ON q._client_id = cl.id
        ORDER BY q.scanned_at DESC
        LIMIT ${limit} OFFSET ${from}
      `)) as any;

      const [countRows] = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM (${unionSql}) q`)) as any;
      
      return {
        items: rows.map((r: any) => ({
          ...rowToMailItem(r, r._client_id),
          company_name: r._client_name
        })),
        total: Number(countRows[0]?.count || 0),
      };
    } catch (dbErr: any) {
      console.error('[mailItemModel.listAllGlobal] DB Error:', dbErr?.message, '\nSQL (union):', unionSql.substring(0, 500));
      throw dbErr;
    }
  },

  async update(id: string, data: Partial<MailItem>, actorId?: string, req?: Request) {
    const row = await locateRecordById(id);
    if (!row) throw new Error("Mail item not found");
    
    const clientId = row._client_id;
    const before = rowToMailItem(row, clientId);
    const tableName = await getClientTableName(clientId);

    const updates = [];
    if (data.irn !== undefined) updates.push(sql`irn = ${data.irn}`);
    if (data.type !== undefined) updates.push(sql`record_type = ${data.type}`);
    if (data.envelope_front_url !== undefined) updates.push(sql`envelope_front_url = ${data.envelope_front_url}`);
    if (data.envelope_back_url !== undefined) updates.push(sql`envelope_back_url = ${data.envelope_back_url}`);
    if (data.content_scan_urls !== undefined) updates.push(sql`content_scan_urls = ${JSON.stringify(data.content_scan_urls)}`);
    if (data.tamper_detected !== undefined) updates.push(sql`tamper_detected = ${data.tamper_detected ? 1 : 0}`);
    if (data.tamper_annotations !== undefined) updates.push(sql`tamper_annotations = ${data.tamper_annotations ? JSON.stringify(data.tamper_annotations) : null}`);
    if (data.ocr_text !== undefined) updates.push(sql`ocr_text = ${data.ocr_text}`);
    if (data.ai_summary !== undefined) updates.push(sql`ai_summary = ${data.ai_summary}`);
    if (data.ai_actions !== undefined) updates.push(sql`ai_actions = ${data.ai_actions ? JSON.stringify(data.ai_actions) : null}`);
    if (data.ai_risk_level !== undefined) updates.push(sql`ai_risk_level = ${data.ai_risk_level}`);
    if (data.retention_until !== undefined) updates.push(sql`retention_until = ${toSqlDatetime(data.retention_until)}`);
    if (data.scanned_by !== undefined) updates.push(sql`scanned_by = ${data.scanned_by}`);
    if (data.scanned_at !== undefined) updates.push(sql`scanned_at = ${toSqlDatetime(data.scanned_at)}`);
    if (data.status !== undefined) updates.push(sql`mail_status = ${data.status}`);

    // Cheque Specific Updates
    if (data.cheque_amount_figures !== undefined) updates.push(sql`cheque_amount_figures = ${data.cheque_amount_figures}`);
    if (data.cheque_amount_words !== undefined) updates.push(sql`cheque_amount_words = ${data.cheque_amount_words}`);
    if (data.cheque_amounts_match !== undefined) updates.push(sql`cheque_amounts_match = ${data.cheque_amounts_match ? 1 : 0}`);
    if (data.cheque_date_on_cheque !== undefined) updates.push(sql`cheque_date_on_cheque = ${data.cheque_date_on_cheque}`);
    if (data.cheque_date_valid !== undefined) updates.push(sql`cheque_date_valid = ${data.cheque_date_valid ? 1 : 0}`);
    if (data.cheque_beneficiary !== undefined) updates.push(sql`cheque_beneficiary = ${data.cheque_beneficiary}`);
    if (data.cheque_beneficiary_match !== undefined) updates.push(sql`cheque_beneficiary_match = ${data.cheque_beneficiary_match}`);
    if (data.cheque_signature_present !== undefined) updates.push(sql`cheque_signature_present = ${data.cheque_signature_present ? 1 : 0}`);
    if (data.cheque_alteration_detected !== undefined) updates.push(sql`cheque_alteration_detected = ${data.cheque_alteration_detected ? 1 : 0}`);
    if (data.cheque_crossing_present !== undefined) updates.push(sql`cheque_crossing_present = ${data.cheque_crossing_present ? 1 : 0}`);
    if (data.cheque_ai_confidence !== undefined) updates.push(sql`cheque_ai_confidence = ${data.cheque_ai_confidence}`);
    if (data.cheque_ai_raw_result !== undefined) updates.push(sql`cheque_ai_raw_result = ${JSON.stringify(data.cheque_ai_raw_result)}`);
    if (data.cheque_decision !== undefined) updates.push(sql`cheque_decision = ${data.cheque_decision}`);
    if (data.cheque_decided_by !== undefined) updates.push(sql`cheque_decided_by = ${data.cheque_decided_by}`);
    if (data.cheque_decided_at !== undefined) updates.push(sql`cheque_decided_at = ${data.cheque_decided_at ? toSqlDatetime(data.cheque_decided_at) : null}`);
    if (data.cheque_status !== undefined) updates.push(sql`cheque_status = ${data.cheque_status}`);

    if (updates.length > 0) {
      const query = sql`UPDATE ${sql.raw(`\`${tableName}\``)} SET ${sql.join(updates, sql`, `)} WHERE id = ${id}`;
      await db.execute(query);
    }
    
    const after = await this.findById(id);

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "record.updated",
        entity: id,
        clientId,
        before,
        after,
        req,
      });
    }

    return after;
  },

  async getDestructionDue(beforeDate: string) {
    const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClients.length) return [];

    const queries = allClients.map(c => 
      sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE mail_status = 'delivered' AND retention_until <= ${new Date(beforeDate)}`
    );
    const unionQuery = sql.join(queries, sql` UNION ALL `);
    
    const [rows] = await db.execute(unionQuery) as any;
    return rows.map((r: any) => rowToMailItem(r, r._client_id));
  },
};

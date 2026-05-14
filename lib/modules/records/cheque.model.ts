import { auditService } from "../audit/audit.service";
import { db, sql } from "@/lib/modules/core/db/mysql";
import {
  ensureClientTableArchiveColumns,
  ensureClientTableDeliveryColumns,
  getClientTableName,
} from "@/lib/modules/core/db/dynamic-table";
import { clients } from "@/lib/modules/core/db/schema";
import { inArray, eq } from "drizzle-orm"; // Kept for other files potentially needed, but we use sql.raw here

export type Cheque = {
  id: string;
  mail_item_id: string;
  amount_figures: number;
  amount_words: string;
  amounts_match: boolean;
  date_on_cheque: string;
  date_valid: boolean;
  beneficiary: string;
  beneficiary_match_score: number;
  signature_present: boolean;
  alteration_detected: boolean;
  crossing_present: boolean;
  ai_confidence: number;
  ai_raw_result: any;
  client_decision: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  deposit_batch_id: string | null;
  status: "validated" | "flagged" | "approved" | "deposit_requested" | "pickup_requested" | "deposited" | "cleared";
  created_at: string;
  mail_items?: {
    client_id: string;
    envelope_front_url?: string | null;
    envelope_back_url?: string | null;
    content_scan_urls?: string[];
  } | null;
};

function parseJsonSafe(value: any, fallback: any = null): any {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToCheque(row: any, clientId: string): Cheque {
  const deliveryStatus = String(row.delivery_status || "");
  const status =
    deliveryStatus === "pending" || deliveryStatus === "approved" || deliveryStatus === "in_transit"
      ? "pickup_requested"
      : row.cheque_status || "validated";

  return {
    id: row.id,
    mail_item_id: row.id,
    amount_figures: Number(row.cheque_amount_figures || 0),
    amount_words: row.cheque_amount_words || "",
    amounts_match: Boolean(row.cheque_amounts_match),
    date_on_cheque: row.cheque_date_on_cheque,
    date_valid: Boolean(row.cheque_date_valid),
    beneficiary: row.cheque_beneficiary,
    beneficiary_match_score: Number(row.cheque_beneficiary_match || 0),
    signature_present: Boolean(row.cheque_signature_present),
    alteration_detected: Boolean(row.cheque_alteration_detected),
    crossing_present: Boolean(row.cheque_crossing_present),
    ai_confidence: Number(row.cheque_ai_confidence || 0),
    ai_raw_result: parseJsonSafe(row.cheque_ai_raw_result, {}),
    client_decision: row.cheque_decision || "pending",
    decided_by: row.cheque_decided_by || null,
    decided_at: row.cheque_decided_at ? new Date(row.cheque_decided_at).toISOString() : null,
    deposit_batch_id: null,
    status,
    created_at: new Date(row.created_at).toISOString(),
    mail_items: {
      client_id: clientId,
      envelope_front_url: row.envelope_front_url ?? null,
      envelope_back_url: row.envelope_back_url ?? null,
      content_scan_urls: parseJsonSafe(row.content_scan_urls, []),
    },
  };
}

async function locateChequeById(id: string) {
  const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClientsRaw.length) return null;

  const [tablesResult] = await db.execute(sql`SHOW TABLES`);
  const existingTableNames = new Set(
    ((tablesResult as unknown) as any[]).map((row) => Object.values(row)[0] as string)
  );
  const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
  if (!allClients.length) return null;

  const queries = allClients.map(c => 
    sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id} AND record_type = 'cheque'`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);
  
  const [rows] = await db.execute(unionQuery) as any;
  return rows[0] || null;
}

export const chequeModel = {
  async listAllGlobal(
    opts: { page?: number; limit?: number; status?: string; archived?: boolean } = {}
  ) {
    const { page = 1, limit = 100, status, archived } = opts;
    const from = (page - 1) * limit;

    const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClientsRaw.length) return { cheques: [], total: 0 };

    const [tablesResult] = await db.execute(sql`SHOW TABLES`);
    const existingTableNames = new Set(((tablesResult as unknown) as any[]).map(row => Object.values(row)[0] as string));
    
    const allClients = allClientsRaw.filter(c => existingTableNames.has(c.tableName));
    if (!allClients.length) return { cheques: [], total: 0 };
    await Promise.all(
      allClients.map(async (c) => {
        if (archived !== undefined) await ensureClientTableArchiveColumns(c.tableName);
        await ensureClientTableDeliveryColumns(c.tableName);
      })
    );

    const conditionParts: string[] = ["record_type = 'cheque'"];
    if (status) conditionParts.push(`cheque_status = '${status.replace(/'/g, "''")}'`);
    if (archived !== undefined) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      conditionParts.push(
        archived
          ? `(is_archived = 1 OR (is_archived IS NULL AND created_at < '${cutoff}'))`
          : `(is_archived = 0 OR (is_archived IS NULL AND created_at >= '${cutoff}'))`
      );
    }
    const whereStr = `WHERE ${conditionParts.join(' AND ')}`;

    // Column list matches rowToCheque dependencies + id, record_type, created_at
    const columnList = `id, record_type, cheque_amount_figures, cheque_amount_words, cheque_amounts_match, cheque_date_on_cheque, cheque_date_valid, cheque_beneficiary, cheque_beneficiary_match, cheque_signature_present, cheque_alteration_detected, cheque_crossing_present, cheque_ai_confidence, cheque_ai_raw_result, cheque_decision, cheque_decided_by, cheque_decided_at, cheque_status, delivery_status, created_at`;

    const unionParts = allClients.map(c => 
      `SELECT ${columnList}, '${c.id}' AS _client_id FROM \`${c.tableName}\` ${whereStr}`
    );
    const unionSql = unionParts.join(' UNION ALL ');

    try {
      const [rows] = await db.execute(sql.raw(`
        SELECT q.*, cl.company_name as _client_name, cl.avatar_url as _client_avatar_url 
        FROM (${unionSql}) q
        INNER JOIN \`clients\` cl ON q._client_id = cl.id
        ORDER BY q.created_at DESC
        LIMIT ${limit} OFFSET ${from}
      `)) as any;

      const [countRows] = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM (${unionSql}) q`)) as any;
      
      return {
        cheques: rows.map((r: any) => ({
          ...rowToCheque(r, r._client_id),
          company_name: r._client_name,
          company_avatar_url: r._client_avatar_url ?? null,
        })),
        total: Number(countRows[0]?.count || 0),
      };
    } catch (dbErr: any) {
      console.error('[chequeModel.listAllGlobal] DB Error:', dbErr?.message);
      throw dbErr;
    }
  },

  async create(data: Partial<Cheque>, actorId?: string, req?: Request) {
    const row = await locateChequeById(data.mail_item_id!);
    if (!row) throw new Error("Base mail item not found for cheque");
    
    const clientId = row._client_id;
    const before = rowToCheque(row, clientId);
    const tableName = await getClientTableName(clientId);

    const updates = [];
    if (data.amount_figures !== undefined) updates.push(sql`cheque_amount_figures = ${data.amount_figures}`);
    if (data.amount_words !== undefined) updates.push(sql`cheque_amount_words = ${data.amount_words}`);
    if (data.amounts_match !== undefined) updates.push(sql`cheque_amounts_match = ${data.amounts_match ? 1 : 0}`);
    if (data.date_on_cheque !== undefined) updates.push(sql`cheque_date_on_cheque = ${data.date_on_cheque}`);
    if (data.date_valid !== undefined) updates.push(sql`cheque_date_valid = ${data.date_valid ? 1 : 0}`);
    if (data.beneficiary !== undefined) updates.push(sql`cheque_beneficiary = ${data.beneficiary}`);
    if (data.beneficiary_match_score !== undefined) updates.push(sql`cheque_beneficiary_match = ${data.beneficiary_match_score}`);
    if (data.signature_present !== undefined) updates.push(sql`cheque_signature_present = ${data.signature_present ? 1 : 0}`);
    if (data.alteration_detected !== undefined) updates.push(sql`cheque_alteration_detected = ${data.alteration_detected ? 1 : 0}`);
    if (data.crossing_present !== undefined) updates.push(sql`cheque_crossing_present = ${data.crossing_present ? 1 : 0}`);
    if (data.ai_confidence !== undefined) updates.push(sql`cheque_ai_confidence = ${data.ai_confidence}`);
    if (data.ai_raw_result !== undefined) updates.push(sql`cheque_ai_raw_result = ${JSON.stringify(data.ai_raw_result)}`);
    if (data.client_decision !== undefined) updates.push(sql`cheque_decision = ${data.client_decision}`);
    if (data.decided_by !== undefined) updates.push(sql`cheque_decided_by = ${data.decided_by}`);
    if (data.decided_at !== undefined) updates.push(sql`cheque_decided_at = ${new Date(data.decided_at!)}`);
    if (data.status !== undefined) updates.push(sql`cheque_status = ${data.status}`);

    if (updates.length > 0) {
      const query = sql`UPDATE ${sql.raw(`\`${tableName}\``)} SET ${sql.join(updates, sql`, `)} WHERE id = ${data.mail_item_id}`;
      await db.execute(query);
    }

    const after = await this.findById(data.mail_item_id!);

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "cheque.validated",
        entity: data.mail_item_id!,
        clientId,
        before,
        after,
        req,
      });
    }

    return after;
  },

  async findById(id: string) {
    const row = await locateChequeById(id);
    if (!row) throw new Error("Cheque not found");
    return rowToCheque(row, row._client_id);
  },

  async listByClient(
    clientId: string,
    page = 1,
    limit = 20,
    archived?: boolean,
    status?: string,
    hiddenIds?: Set<string>
  ) {
    const from = (page - 1) * limit;
    const tableName = await getClientTableName(clientId);
    if (archived !== undefined) await ensureClientTableArchiveColumns(tableName);
    await ensureClientTableDeliveryColumns(tableName);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const archiveClause =
      archived === undefined
        ? sql``
        : archived
          ? sql` AND (is_archived = 1 OR (is_archived IS NULL AND created_at < ${cutoff}))`
          : sql` AND (is_archived = 0 OR (is_archived IS NULL AND created_at >= ${cutoff}))`;
    const statusClause = status ? sql` AND cheque_status = ${status}` : sql``;
    const hiddenClause =
      hiddenIds && hiddenIds.size > 0
        ? sql` AND id NOT IN (${sql.join(Array.from(hiddenIds).map((id) => sql`${id}`), sql`, `)})`
        : sql``;

    const query = sql`
      SELECT * FROM ${sql.raw(`\`${tableName}\``)}
      WHERE record_type = 'cheque'${archiveClause}${statusClause}${hiddenClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${from}
    `;
    const [rows] = await db.execute(query) as any;

    const countQuery = sql`
      SELECT COUNT(*) as count
      FROM ${sql.raw(`\`${tableName}\``)}
      WHERE record_type = 'cheque'${archiveClause}${statusClause}${hiddenClause}
    `;
    const [countRows] = await db.execute(countQuery) as any;

    const [clientRow] = await db
      .select({ companyName: clients.companyName, avatarUrl: clients.avatarUrl })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    const companyName = clientRow?.companyName;
    const companyAvatarUrl = clientRow?.avatarUrl ?? null;

    return {
      cheques: rows.map((r: any) => ({
        ...rowToCheque(r, clientId),
        company_name: companyName,
        company_avatar_url: companyAvatarUrl,
      })),
      total: Number(countRows[0]?.count || 0),
    };
  },

  async updateStatus(id: string, status: string, userId?: string, req?: Request) {
    const row = await locateChequeById(id);
    if (!row) throw new Error("Cheque not found");
    
    const clientId = row._client_id;
    const before = rowToCheque(row, clientId);
    const tableName = await getClientTableName(clientId);

    const updates = [sql`cheque_decision = ${status}`];

    if (userId) {
      updates.push(sql`cheque_decided_by = ${userId}`, sql`cheque_decided_at = ${new Date()}`);
    }
    
    const query = sql`
      UPDATE ${sql.raw(`\`${tableName}\``)} 
      SET ${sql.join(updates, sql`, `)} 
      WHERE id = ${id} AND record_type = 'cheque'
    `;

    await db.execute(query);
    const after = await this.findById(id);

    if (userId) {
      await auditService.log({
        actor: userId,
        actor_role: "client", // Clients approve/reject cheques
        action: "cheque.decided",
        entity: id,
        clientId,
        before,
        after,
        req,
      });
    }

    return after;
  },

  async archive(id: string, actorId?: string, req?: Request) {
    const row = await locateChequeById(id);
    if (!row) throw new Error("Cheque not found");
    const clientId = row._client_id;
    const tableName = await getClientTableName(clientId);
    await ensureClientTableArchiveColumns(tableName);
    await db.execute(
      sql`UPDATE ${sql.raw(`\`${tableName}\``)} SET is_archived = 1, archived_at = ${new Date()} WHERE id = ${id} AND record_type = 'cheque'`
    );
    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "cheque.archived",
        entity: id,
        clientId,
        req,
      });
    }
  },

  async unarchive(id: string, actorId?: string, req?: Request) {
    const row = await locateChequeById(id);
    if (!row) throw new Error("Cheque not found");
    const clientId = row._client_id;
    const tableName = await getClientTableName(clientId);
    await ensureClientTableArchiveColumns(tableName);
    await db.execute(
      sql`UPDATE ${sql.raw(`\`${tableName}\``)} SET is_archived = 0, archived_at = NULL WHERE id = ${id} AND record_type = 'cheque'`
    );
    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "cheque.unarchived",
        entity: id,
        clientId,
        req,
      });
    }
  },

  async delete(id: string, actorId?: string, req?: Request) {
    const row = await locateChequeById(id);
    if (!row) throw new Error("Cheque not found");

    const clientId = row._client_id;
    const before = rowToCheque(row, clientId);
    const tableName = await getClientTableName(clientId);

    await db.execute(
      sql`DELETE FROM ${sql.raw(`\`${tableName}\``)} WHERE id = ${id} AND record_type = 'cheque'`
    );

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "cheque.deleted",
        entity: id,
        clientId,
        before,
        req,
      });
    }
  },

  async assignToBatch(chequeIds: string[], batchId: string, actorId?: string, req?: Request) {
    if (chequeIds.length === 0) return;

    const allClients = await db.select({ tableName: clients.tableName }).from(clients);
    const placeholders = sql.join(chequeIds.map(id => sql`${id}`), sql`, `);
    
    for (const client of allClients) {
      const query = sql`
        UPDATE ${sql.raw(`\`${client.tableName}\``)} 
        SET cheque_status = 'deposited' 
        WHERE id IN (${placeholders}) AND record_type = 'cheque'
      `;
      await db.execute(query);
    }

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "admin",
        action: "cheque.batch_deposited",
        entity: batchId,
        after: { chequeIds },
        req,
      });
    }
  },
};

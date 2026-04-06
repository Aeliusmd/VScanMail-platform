import { auditService } from "../audit/audit.service";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { getClientTableName } from "@/lib/modules/core/db/dynamic-table";
import { clients } from "@/lib/modules/core/db/schema";
import { inArray } from "drizzle-orm"; // Kept for other files potentially needed, but we use sql.raw here

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
  status: "validated" | "flagged" | "approved" | "deposited" | "cleared";
  created_at: string;
  mail_items?: { client_id: string } | null;
};

function rowToCheque(row: any, clientId: string): Cheque {
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
    ai_raw_result: typeof row.cheque_ai_raw_result === 'string' ? JSON.parse(row.cheque_ai_raw_result) : row.cheque_ai_raw_result || {},
    client_decision: row.cheque_decision || "pending",
    decided_by: row.cheque_decided_by || null,
    decided_at: row.cheque_decided_at ? new Date(row.cheque_decided_at).toISOString() : null,
    deposit_batch_id: null,
    status: row.cheque_status || "validated",
    created_at: new Date(row.created_at).toISOString(),
    mail_items: { client_id: clientId },
  };
}

async function locateChequeById(id: string) {
  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClients.length) return null;

  const queries = allClients.map(c => 
    sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id} AND record_type = 'cheque'`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);
  
  const [rows] = await db.execute(unionQuery) as any;
  return rows[0] || null;
}

export const chequeModel = {
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
        actor_role: "operator",
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

  async listByClient(clientId: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const tableName = await getClientTableName(clientId);

    const query = sql`
      SELECT * FROM ${sql.raw(`\`${tableName}\``)}
      WHERE record_type = 'cheque'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${from}
    `;
    const [rows] = await db.execute(query) as any;

    const countQuery = sql`SELECT COUNT(*) as count FROM ${sql.raw(`\`${tableName}\``)} WHERE record_type = 'cheque'`;
    const [countRows] = await db.execute(countQuery) as any;

    return {
      cheques: rows.map((r: any) => rowToCheque(r, clientId)),
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
        actor_role: "operator",
        action: "cheque.batch_deposited",
        entity: batchId,
        after: { chequeIds },
        req,
      });
    }
  },
};

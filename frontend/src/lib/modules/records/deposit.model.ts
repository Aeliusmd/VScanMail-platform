import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { ensureClientTableDepositColumns } from "@/lib/modules/core/db/dynamic-table";

export type DepositDecision = "pending" | "approved" | "rejected";

function tryParseJson(v: unknown): any {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export type DepositRow = {
  chequeId: string;
  mailItemId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  amountFigures: number;
  createdAt: string;

  chequeStatus: string | null;
  requestedAt: string | null;
  requestedBy: string | null;

  destinationBankAccountId: string | null;
  destinationBankName: string | null;
  destinationBankNickname: string | null;
  destinationBankLast4: string | null;

  decision: DepositDecision | null;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectReason: string | null;

  markedDepositedAt: string | null;
  markedDepositedBy: string | null;

  slipUrl: string | null;
  slipUploadedAt: string | null;
  slipUploadedBy: string | null;
  slipAiResult: any | null;

  aiSummary: string | null;
};

async function locateChequeById(id: string) {
  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClients.length) return null;

  await Promise.all(allClients.map((c) => ensureClientTableDepositColumns(c.tableName)));

  const queries = allClients.map(
    (c) =>
      sql`SELECT *, ${c.id} AS _client_id, ${c.tableName} AS _table_name FROM ${sql.raw(
        `\`${c.tableName}\``
      )} WHERE id = ${id} AND record_type = 'cheque'`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);

  const [rows] = (await db.execute(unionQuery)) as any;
  return rows[0] || null;
}

export const depositModel = {
  async findChequeRowById(id: string) {
    return locateChequeById(id);
  },

  async listForClient(clientId: string, opts?: { limit?: number }) {
    const limit = opts?.limit ?? 200;

    const [clientRow] = await db
      .select({ tableName: clients.tableName })
      .from(clients)
      .where(sql`id = ${clientId}`)
      .limit(1);

    if (!clientRow?.tableName) return { deposits: [] as DepositRow[] };

    const tableName = clientRow.tableName;
    await ensureClientTableDepositColumns(tableName);

    const columnList = [
      "id AS chequeId",
      "id AS mailItemId",
      `'${clientId}' AS clientId`,
      "cheque_amount_figures AS amountFigures",
      "created_at AS createdAt",
      "cheque_status AS chequeStatus",
      "deposit_requested_at AS requestedAt",
      "deposit_requested_by AS requestedBy",
      "deposit_destination_bank_account_id AS destinationBankAccountId",
      "deposit_destination_bank_name AS destinationBankName",
      "deposit_destination_bank_nickname AS destinationBankNickname",
      "deposit_destination_bank_last4 AS destinationBankLast4",
      "deposit_decision AS decision",
      "deposit_decided_at AS decidedAt",
      "deposit_decided_by AS decidedBy",
      "deposit_reject_reason AS rejectReason",
      "deposit_marked_deposited_at AS markedDepositedAt",
      "deposit_marked_deposited_by AS markedDepositedBy",
      "deposit_slip_url AS slipUrl",
      "deposit_slip_uploaded_at AS slipUploadedAt",
      "deposit_slip_uploaded_by AS slipUploadedBy",
      "deposit_slip_ai_result AS slipAiResult",
      "ai_summary AS aiSummary",
    ].join(", ");

    const [rows] = (await db.execute(
      sql.raw(
        `SELECT ${columnList}
         FROM \`${tableName}\`
         WHERE record_type = 'cheque'
           AND deposit_requested_at IS NOT NULL
         ORDER BY deposit_requested_at DESC
         LIMIT ${Number(limit)}`
      )
    )) as any;

    const deposits: DepositRow[] = (rows as any[]).map((r) => ({
      chequeId: String(r.chequeId),
      mailItemId: String(r.mailItemId),
      clientId: String(r.clientId),
      amountFigures: Number(r.amountFigures || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      chequeStatus: r.chequeStatus ?? null,
      requestedAt: r.requestedAt ? new Date(r.requestedAt).toISOString() : null,
      requestedBy: r.requestedBy ?? null,
      destinationBankAccountId: r.destinationBankAccountId ?? null,
      destinationBankName: r.destinationBankName ?? null,
      destinationBankNickname: r.destinationBankNickname ?? null,
      destinationBankLast4: r.destinationBankLast4 ?? null,
      decision: (r.decision as any) ?? null,
      decidedAt: r.decidedAt ? new Date(r.decidedAt).toISOString() : null,
      decidedBy: r.decidedBy ?? null,
      rejectReason: r.rejectReason ?? null,
      markedDepositedAt: r.markedDepositedAt ? new Date(r.markedDepositedAt).toISOString() : null,
      markedDepositedBy: r.markedDepositedBy ?? null,
      slipUrl: r.slipUrl ?? null,
      slipUploadedAt: r.slipUploadedAt ? new Date(r.slipUploadedAt).toISOString() : null,
      slipUploadedBy: r.slipUploadedBy ?? null,
      slipAiResult: tryParseJson(r.slipAiResult),
      aiSummary: r.aiSummary ?? null,
    }));

    return { deposits };
  },

  async listAllForAdmin(opts?: { limit?: number }) {
    const limit = opts?.limit ?? 500;

    const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClientsRaw.length) return { deposits: [] as DepositRow[] };

    const [tablesResult] = await db.execute(sql`SHOW TABLES`);
    const existingTableNames = new Set(((tablesResult as unknown) as any[]).map((row) => Object.values(row)[0] as string));

    const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
    if (!allClients.length) return { deposits: [] as DepositRow[] };

    await Promise.all(allClients.map((c) => ensureClientTableDepositColumns(c.tableName)));

    const columnList = [
      "id AS chequeId",
      "id AS mailItemId",
      "cheque_amount_figures AS amountFigures",
      "created_at AS createdAt",
      "cheque_status AS chequeStatus",
      "deposit_requested_at AS requestedAt",
      "deposit_requested_by AS requestedBy",
      "deposit_destination_bank_account_id AS destinationBankAccountId",
      "deposit_destination_bank_name AS destinationBankName",
      "deposit_destination_bank_nickname AS destinationBankNickname",
      "deposit_destination_bank_last4 AS destinationBankLast4",
      "deposit_decision AS decision",
      "deposit_decided_at AS decidedAt",
      "deposit_decided_by AS decidedBy",
      "deposit_reject_reason AS rejectReason",
      "deposit_marked_deposited_at AS markedDepositedAt",
      "deposit_marked_deposited_by AS markedDepositedBy",
      "deposit_slip_url AS slipUrl",
      "deposit_slip_uploaded_at AS slipUploadedAt",
      "deposit_slip_uploaded_by AS slipUploadedBy",
      "deposit_slip_ai_result AS slipAiResult",
      "ai_summary AS aiSummary",
    ].join(", ");

    const unionParts = allClients.map(
      (c) =>
        `SELECT ${columnList}, '${c.id}' AS clientId FROM \`${c.tableName}\`
         WHERE record_type = 'cheque' AND deposit_requested_at IS NOT NULL`
    );
    const unionSql = unionParts.join(" UNION ALL ");

    const [rows] = (await db.execute(
      sql.raw(
        `SELECT q.*, cl.company_name AS clientName, cl.email AS clientEmail
         FROM (${unionSql}) q
         INNER JOIN \`clients\` cl ON q.clientId = cl.id
         ORDER BY q.requestedAt DESC
         LIMIT ${Number(limit)}`
      )
    )) as any;

    const deposits: DepositRow[] = (rows as any[]).map((r) => ({
      chequeId: String(r.chequeId),
      mailItemId: String(r.mailItemId),
      clientId: String(r.clientId),
      clientName: r.clientName ?? undefined,
      clientEmail: r.clientEmail ?? undefined,
      amountFigures: Number(r.amountFigures || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      chequeStatus: r.chequeStatus ?? null,
      requestedAt: r.requestedAt ? new Date(r.requestedAt).toISOString() : null,
      requestedBy: r.requestedBy ?? null,
      destinationBankAccountId: r.destinationBankAccountId ?? null,
      destinationBankName: r.destinationBankName ?? null,
      destinationBankNickname: r.destinationBankNickname ?? null,
      destinationBankLast4: r.destinationBankLast4 ?? null,
      decision: (r.decision as any) ?? null,
      decidedAt: r.decidedAt ? new Date(r.decidedAt).toISOString() : null,
      decidedBy: r.decidedBy ?? null,
      rejectReason: r.rejectReason ?? null,
      markedDepositedAt: r.markedDepositedAt ? new Date(r.markedDepositedAt).toISOString() : null,
      markedDepositedBy: r.markedDepositedBy ?? null,
      slipUrl: r.slipUrl ?? null,
      slipUploadedAt: r.slipUploadedAt ? new Date(r.slipUploadedAt).toISOString() : null,
      slipUploadedBy: r.slipUploadedBy ?? null,
      slipAiResult: tryParseJson(r.slipAiResult),
      aiSummary: r.aiSummary ?? null,
    }));

    return { deposits };
  },
};


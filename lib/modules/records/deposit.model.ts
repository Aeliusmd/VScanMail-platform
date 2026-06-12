import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { ensureClientTableDepositColumns, ensureClientTableChequeTypeColumn } from "@/lib/modules/core/db/dynamic-table";

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

function escapeIdent(ident: string) {
  return `\`${String(ident).replace(/`/g, "``")}\``;
}

function toIsoString(value: unknown): string | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value as any);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  return date.toISOString();
}

function toIsoStringOrNow(value: unknown): string {
  return toIsoString(value) ?? new Date().toISOString();
}

function toTimeOrZero(value: unknown): number {
  const iso = toIsoString(value);
  return iso ? new Date(iso).getTime() : 0;
}

async function getExistingTableNames(): Promise<Set<string>> {
  const [tablesResult] = await db.execute(sql`SHOW TABLES`);
  return new Set(((tablesResult as unknown) as any[]).map((row) => String(Object.values(row)[0])));
}

const ADMIN_LIST_CONCURRENCY = 4;

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  if (!items.length) return;
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
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

const DEPOSIT_CHEQUE_COLS = [
  "id", "record_type", "envelope_front_url", "envelope_back_url", "content_scan_urls",
  "ai_summary", "created_at",
  "cheque_amount_figures", "cheque_amount_words", "cheque_amounts_match", "cheque_date_on_cheque",
  "cheque_date_valid", "cheque_beneficiary", "cheque_beneficiary_match", "cheque_signature_present",
  "cheque_alteration_detected", "cheque_crossing_present", "cheque_ai_confidence",
  "cheque_ai_raw_result", "cheque_type", "cheque_decision", "cheque_decided_by",
  "cheque_decided_at", "cheque_status",
  "deposit_requested_at", "deposit_requested_by",
  "deposit_destination_bank_account_id", "deposit_destination_bank_name",
  "deposit_destination_bank_nickname", "deposit_destination_bank_last4",
  "deposit_decision", "deposit_decided_by", "deposit_decided_at", "deposit_reject_reason",
  "deposit_marked_deposited_at", "deposit_marked_deposited_by",
  "deposit_slip_url", "deposit_slip_uploaded_at", "deposit_slip_uploaded_by", "deposit_slip_ai_result",
  "delivery_status", "delivery_requested_at",
].map((c) => `\`${c}\``).join(", ");

async function locateChequeById(id: string) {
  const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClientsRaw.length) return null;

  const existingTableNames = await getExistingTableNames();
  const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
  if (!allClients.length) return null;

  // Both ensures required: deposit columns and cheque_type were added to newer tables only;
  // explicit column list keeps UNION ALL safe against future schema drift.
  await Promise.all(
    allClients.map(async (c) => {
      await ensureClientTableDepositColumns(c.tableName);
      await ensureClientTableChequeTypeColumn(c.tableName);
    })
  );

  const queries = allClients.map((c) =>
    sql`SELECT ${sql.raw(DEPOSIT_CHEQUE_COLS)}, ${c.id} AS _client_id, ${c.tableName} AS _table_name FROM ${sql.raw(
      `\`${c.tableName}\``
    )} WHERE id = ${id} AND record_type = 'cheque'`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);

  const [rows] = (await db.execute(unionQuery)) as any;
  return rows[0] || null;
}

async function locateChequeByClientAndId(clientId: string, id: string) {
  const [clientRow] = await db
    .select({ tableName: clients.tableName })
    .from(clients)
    .where(sql`id = ${clientId}`)
    .limit(1);

  if (!clientRow?.tableName) return null;

  const existingTableNames = await getExistingTableNames();
  if (!existingTableNames.has(clientRow.tableName)) return null;

  await ensureClientTableDepositColumns(clientRow.tableName);

  const [rows] = (await db.execute(
    sql.raw(
      `SELECT *, '${String(clientId).replace(/'/g, "''")}' AS _client_id, '${String(clientRow.tableName).replace(
        /'/g,
        "''"
      )}' AS _table_name
       FROM ${escapeIdent(clientRow.tableName)}
       WHERE id = '${String(id).replace(/'/g, "''")}' AND record_type = 'cheque'`
    )
  )) as any;

  return rows[0] || null;
}

export const depositModel = {
  async findChequeRowById(id: string) {
    return locateChequeById(id);
  },

  async findChequeRowByClientAndId(clientId: string, id: string) {
    return locateChequeByClientAndId(clientId, id);
  },

  async listForClient(clientId: string, opts?: { limit?: number; from?: string }) {
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

    const fromClause = opts?.from
      ? `AND deposit_requested_at >= '${new Date(opts.from).toISOString().slice(0, 19).replace("T", " ")}'`
      : "";
    const [rows] = (await db.execute(
      sql.raw(
        `SELECT ${columnList}
         FROM \`${tableName}\`
         WHERE record_type = 'cheque'
           AND deposit_requested_at IS NOT NULL
           ${fromClause}
         ORDER BY deposit_requested_at DESC
         LIMIT ${Number(limit)}`
      )
    )) as any;

    const deposits: DepositRow[] = (rows as any[]).map((r) => ({
      chequeId: String(r.chequeId),
      mailItemId: String(r.mailItemId),
      clientId: String(r.clientId),
      amountFigures: Number(r.amountFigures || 0),
      createdAt: toIsoStringOrNow(r.createdAt),
      chequeStatus: r.chequeStatus ?? null,
      requestedAt: toIsoString(r.requestedAt),
      requestedBy: r.requestedBy ?? null,
      destinationBankAccountId: r.destinationBankAccountId ?? null,
      destinationBankName: r.destinationBankName ?? null,
      destinationBankNickname: r.destinationBankNickname ?? null,
      destinationBankLast4: r.destinationBankLast4 ?? null,
      decision: (r.decision as any) ?? null,
      decidedAt: toIsoString(r.decidedAt),
      decidedBy: r.decidedBy ?? null,
      rejectReason: r.rejectReason ?? null,
      markedDepositedAt: toIsoString(r.markedDepositedAt),
      markedDepositedBy: r.markedDepositedBy ?? null,
      slipUrl: r.slipUrl ?? null,
      slipUploadedAt: toIsoString(r.slipUploadedAt),
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

    const existingTableNames = await getExistingTableNames();
    const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
    if (!allClients.length) return { deposits: [] as DepositRow[] };

    const clientMetaRows = await db
      .select({ id: clients.id, companyName: clients.companyName, email: clients.email })
      .from(clients);
    const clientMeta = new Map(clientMetaRows.map((r) => [r.id, r]));

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

    // Run DDL sequentially to avoid lock storms; reads can stay parallel.
    for (const c of allClients) {
      try {
        await ensureClientTableDepositColumns(c.tableName);
      } catch (err) {
        console.warn(`[depositModel] ensure failed for ${c.tableName}:`, err);
      }
    }

    const collected: any[] = [];
    await runWithConcurrency(allClients, ADMIN_LIST_CONCURRENCY, async (c) => {
      try {
        const [rows] = (await db.execute(
          sql.raw(
            `SELECT ${columnList}
             FROM ${escapeIdent(c.tableName)}
             WHERE record_type = 'cheque' AND deposit_requested_at IS NOT NULL`
          )
        )) as any;
        const meta = clientMeta.get(c.id);
        for (const r of rows as any[]) {
          collected.push({
            ...r,
            clientId: c.id,
            clientName: meta?.companyName,
            clientEmail: meta?.email,
          });
        }
      } catch (err) {
        console.warn(`[depositModel] skip listAllForAdmin for ${c.tableName}:`, err);
      }
    });

    collected.sort((a, b) => {
      const ta = toTimeOrZero(a.requestedAt);
      const tb = toTimeOrZero(b.requestedAt);
      return tb - ta;
    });

    const deposits: DepositRow[] = collected.slice(0, limit).map((r) => ({
      chequeId: String(r.chequeId),
      mailItemId: String(r.mailItemId),
      clientId: String(r.clientId),
      clientName: r.clientName ?? undefined,
      clientEmail: r.clientEmail ?? undefined,
      amountFigures: Number(r.amountFigures || 0),
      createdAt: toIsoStringOrNow(r.createdAt),
      chequeStatus: r.chequeStatus ?? null,
      requestedAt: toIsoString(r.requestedAt),
      requestedBy: r.requestedBy ?? null,
      destinationBankAccountId: r.destinationBankAccountId ?? null,
      destinationBankName: r.destinationBankName ?? null,
      destinationBankNickname: r.destinationBankNickname ?? null,
      destinationBankLast4: r.destinationBankLast4 ?? null,
      decision: (r.decision as any) ?? null,
      decidedAt: toIsoString(r.decidedAt),
      decidedBy: r.decidedBy ?? null,
      rejectReason: r.rejectReason ?? null,
      markedDepositedAt: toIsoString(r.markedDepositedAt),
      markedDepositedBy: r.markedDepositedBy ?? null,
      slipUrl: r.slipUrl ?? null,
      slipUploadedAt: toIsoString(r.slipUploadedAt),
      slipUploadedBy: r.slipUploadedBy ?? null,
      slipAiResult: tryParseJson(r.slipAiResult),
      aiSummary: r.aiSummary ?? null,
    }));

    return { deposits };
  },
};

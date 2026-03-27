import { db, sql } from "@/lib/db/mysql";
import { cheques, mailItems } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

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
};

function rowToCheque(row: typeof cheques.$inferSelect): Cheque {
  return {
    id: row.id,
    mail_item_id: row.mailItemId,
    amount_figures: Number(row.amountFigures),
    amount_words: row.amountWords,
    amounts_match: Boolean(row.amountsMatch),
    date_on_cheque: row.dateOnCheque,
    date_valid: Boolean(row.dateValid),
    beneficiary: row.beneficiary,
    beneficiary_match_score: Number(row.beneficiaryMatchScore),
    signature_present: Boolean(row.signaturePresent),
    alteration_detected: Boolean(row.alterationDetected),
    crossing_present: Boolean(row.crossingPresent),
    ai_confidence: Number(row.aiConfidence),
    ai_raw_result: row.aiRawResult,
    client_decision: row.clientDecision as any,
    decided_by: row.decidedBy ?? null,
    decided_at: row.decidedAt ? (row.decidedAt as Date).toISOString() : null,
    deposit_batch_id: row.depositBatchId ?? null,
    status: row.status as any,
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const chequeModel = {
  async create(data: Partial<Cheque>) {
    const toInsert: typeof cheques.$inferInsert = {
      id: data.id!,
      mailItemId: data.mail_item_id!,
      amountFigures: String(data.amount_figures ?? 0),
      amountWords: data.amount_words!,
      amountsMatch: Boolean(data.amounts_match ?? false),
      dateOnCheque: data.date_on_cheque!,
      dateValid: Boolean(data.date_valid ?? false),
      beneficiary: data.beneficiary!,
      beneficiaryMatchScore: String(data.beneficiary_match_score ?? 0),
      signaturePresent: Boolean(data.signature_present ?? false),
      alterationDetected: Boolean(data.alteration_detected ?? false),
      crossingPresent: Boolean(data.crossing_present ?? false),
      aiConfidence: String(data.ai_confidence ?? 0),
      aiRawResult: data.ai_raw_result ?? {},
      clientDecision: (data.client_decision as any) ?? "pending",
      decidedBy: data.decided_by ?? undefined,
      decidedAt: data.decided_at ? new Date(data.decided_at) : undefined,
      depositBatchId: data.deposit_batch_id ?? undefined,
      status: (data.status as any) ?? "validated",
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(cheques).values(toInsert);
    const rows = await db.select().from(cheques).where(eq(cheques.id, toInsert.id)).limit(1);
    if (!rows[0]) throw new Error("Failed to create cheque");
    return rowToCheque(rows[0]);
  },

  async findById(id: string) {
    const rows = await db
      .select({
        cheque: cheques,
        mail_item: mailItems,
      })
      .from(cheques)
      .leftJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
      .where(eq(cheques.id, id))
      .limit(1);

    const row = rows[0];
    if (!row?.cheque) throw new Error("Cheque not found");

    return {
      ...rowToCheque(row.cheque),
      mail_items: row.mail_item ? { client_id: row.mail_item.clientId } : null,
    } as any;
  },

  async listByClient(clientId: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const rows = await db
      .select({ cheque: cheques })
      .from(cheques)
      .innerJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
      .where(eq(mailItems.clientId, clientId))
      .orderBy(desc(cheques.createdAt))
      .limit(limit)
      .offset(from);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(cheques)
      .innerJoin(mailItems, eq(cheques.mailItemId, mailItems.id))
      .where(eq(mailItems.clientId, clientId));

    return {
      cheques: rows.map((r) => rowToCheque(r.cheque)),
      total: Number(totalRows[0]?.count || 0),
    };
  },

  async updateStatus(id: string, status: string, userId?: string) {
    const update: any = { client_decision: status };
    if (userId) {
      update.decided_by = userId;
      update.decided_at = new Date().toISOString();
    }
    await db
      .update(cheques)
      .set({
        clientDecision: status as any,
        decidedBy: userId ?? undefined,
        decidedAt: userId ? new Date() : undefined,
      })
      .where(eq(cheques.id, id));

    const rows = await db.select().from(cheques).where(eq(cheques.id, id)).limit(1);
    if (!rows[0]) throw new Error("Cheque not found");
    return rowToCheque(rows[0]);
  },

  async assignToBatch(chequeIds: string[], batchId: string) {
    if (chequeIds.length === 0) return;
    await db
      .update(cheques)
      .set({ depositBatchId: batchId, status: "deposited" })
      .where(inArray(cheques.id, chequeIds));
  },
};

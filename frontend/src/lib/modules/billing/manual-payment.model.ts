import { auditService } from "../audit/audit.service";
import { db, sql } from "../core/db/mysql";
import { manualPayments } from "../core/db/schema";
import { and, eq } from "drizzle-orm";

export type ManualPayment = {
  id: string;
  client_id: string;
  recorded_by: string;
  amount: number;
  payment_method: "cash" | "bank_transfer" | "cheque" | "other";
  reference_no?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  payment_date: string;
  period_covered: "monthly" | "quarterly" | "annual" | "custom";
  period_start: string;
  period_end: string;
  created_at: string;
};

function rowToManualPayment(row: typeof manualPayments.$inferSelect): ManualPayment {
  return {
    id: row.id,
    client_id: row.clientId,
    recorded_by: row.recordedBy,
    amount: Number(row.amount),
    payment_method: row.paymentMethod as any,
    reference_no: row.referenceNo,
    receipt_url: row.receiptUrl,
    notes: row.notes,
    payment_date: row.paymentDate.toISOString(),
    period_covered: row.periodCovered as any,
    period_start: row.periodStart.toISOString(),
    period_end: row.periodEnd.toISOString(),
    created_at: row.createdAt.toISOString(),
  };
}

export const manualPaymentModel = {
  async create(data: Partial<ManualPayment>, req?: Request) {
    const id = crypto.randomUUID();
    const toInsert: typeof manualPayments.$inferInsert = {
      id,
      clientId: data.client_id!,
      recordedBy: data.recorded_by!,
      amount: String(data.amount!),
      paymentMethod: data.payment_method as any,
      referenceNo: data.reference_no ?? null,
      receiptUrl: data.receipt_url ?? null,
      notes: data.notes ?? null,
      paymentDate: new Date(data.payment_date!),
      periodCovered: data.period_covered as any,
      periodStart: new Date(data.period_start!),
      periodEnd: new Date(data.period_end!),
      createdAt: new Date(),
    };

    await db.insert(manualPayments).values(toInsert);

    const record = await this.findById(id);

    // Audit log
    await auditService.log({
      actor: data.recorded_by!,
      actor_role: "super_admin",
      action: "billing.manual_payment_recorded",
      entity: id,
      clientId: data.client_id!,
      after: record,
      req,
    });

    return record;
  },

  async findById(id: string) {
    const rows = await db.select().from(manualPayments).where(eq(manualPayments.id, id)).limit(1);
    if (!rows[0]) throw new Error("Manual payment not found");
    return rowToManualPayment(rows[0]);
  },

  async listByClient(clientId: string) {
    const rows = await db
      .select()
      .from(manualPayments)
      .where(eq(manualPayments.clientId, clientId))
      .orderBy(sql`${manualPayments.paymentDate} DESC`);
    return rows.map(rowToManualPayment);
  },
};

import { auditService } from "../audit/audit.service";
import { db, sql } from "../core/db/mysql";
import { manualPayments, clients } from "../core/db/schema";
import { and, eq } from "drizzle-orm";

export type ManualPayment = {
  id: string;
  client_id: string;
  company_name?: string;
  recorded_by: string;
  amount: number;
  payment_method: "cash" | "bank_transfer" | "cheque" | "other" | "card";
  reference_no?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  payment_date: string;
  period_covered: "monthly" | "quarterly" | "annual" | "custom";
  duration_months: number;
  period_start: string;
  period_end: string;
  created_at: string;
};

function mapResultToManualPayment(data: { mp: typeof manualPayments.$inferSelect, companyName: string | null }): ManualPayment {
  const { mp, companyName } = data;
  return {
    id: mp.id,
    client_id: mp.clientId,
    company_name: companyName || 'N/A',
    recorded_by: mp.recordedBy,
    amount: Number(mp.amount),
    payment_method: mp.paymentMethod as any,
    reference_no: mp.referenceNo,
    receipt_url: mp.receiptUrl,
    notes: mp.notes,
    payment_date: mp.paymentDate.toISOString(),
    period_covered: mp.periodCovered as any,
    duration_months: mp.durationMonths,
    period_start: mp.periodStart.toISOString(),
    period_end: mp.periodEnd.toISOString(),
    created_at: mp.createdAt.toISOString(),
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
      durationMonths: data.duration_months ?? 1,
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
    const rows = await db
      .select({ mp: manualPayments, companyName: clients.companyName })
      .from(manualPayments)
      .leftJoin(clients, eq(manualPayments.clientId, clients.id))
      .where(eq(manualPayments.id, id))
      .limit(1);

    if (!rows[0]) throw new Error("Manual payment not found");
    return mapResultToManualPayment(rows[0]);
  },

  async listAll() {
    const rows = await db
      .select({ mp: manualPayments, companyName: clients.companyName })
      .from(manualPayments)
      .leftJoin(clients, eq(manualPayments.clientId, clients.id))
      .orderBy(sql`${manualPayments.paymentDate} DESC`);
      
    return rows.map(mapResultToManualPayment);
  },

  async listByClient(clientId: string) {
    const rows = await db
      .select({ mp: manualPayments, companyName: clients.companyName })
      .from(manualPayments)
      .leftJoin(clients, eq(manualPayments.clientId, clients.id))
      .where(eq(manualPayments.clientId, clientId))
      .orderBy(sql`${manualPayments.paymentDate} DESC`);
      
    return rows.map(mapResultToManualPayment);
  },

  async update(id: string, data: Partial<ManualPayment>, req?: Request) {
    const before = await this.findById(id);
    
    const toUpdate: Partial<typeof manualPayments.$inferInsert> = {};
    if (data.amount !== undefined) toUpdate.amount = String(data.amount);
    if (data.payment_method !== undefined) toUpdate.paymentMethod = data.payment_method as any;
    if (data.reference_no !== undefined) toUpdate.referenceNo = data.reference_no;
    if (data.notes !== undefined) toUpdate.notes = data.notes;
    if (data.payment_date !== undefined) toUpdate.paymentDate = new Date(data.payment_date);
    if (data.duration_months !== undefined) toUpdate.durationMonths = data.duration_months;
    if (data.period_start !== undefined) toUpdate.periodStart = new Date(data.period_start);
    if (data.period_end !== undefined) toUpdate.periodEnd = new Date(data.period_end);

    await db.update(manualPayments).set(toUpdate).where(eq(manualPayments.id, id));

    const after = await this.findById(id);

    await auditService.log({
      actor: data.recorded_by || before.recorded_by,
      actor_role: "super_admin",
      action: "billing.manual_payment_updated",
      entity: id,
      clientId: before.client_id,
      before,
      after,
      req,
    });

    return after;
  },

  async delete(id: string, actorId: string, req?: Request) {
    const before = await this.findById(id);
    await db.delete(manualPayments).where(eq(manualPayments.id, id));

    await auditService.log({
      actor: actorId,
      actor_role: "super_admin",
      action: "billing.manual_payment_deleted",
      entity: id,
      clientId: before.client_id,
      before,
      req,
    });
  },
};

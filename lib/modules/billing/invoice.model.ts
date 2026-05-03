import { desc, eq } from "drizzle-orm";
import { db, sql } from "../core/db/mysql";
import { invoices } from "../core/db/schema";

export type InvoiceStatus = "paid" | "open" | "void" | "uncollectible" | "draft";

export type Invoice = {
  id: string;
  client_id: string;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  currency: string;
  plan_tier: string | null;
  description: string | null;
  pdf_url: string | null;
  hosted_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
};

function dateToIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function rowToInvoice(row: typeof invoices.$inferSelect): Invoice {
  return {
    id: row.id,
    client_id: row.clientId,
    stripe_invoice_id: row.stripeInvoiceId ?? null,
    stripe_subscription_id: row.stripeSubscriptionId ?? null,
    invoice_number: row.invoiceNumber ?? null,
    status: row.status,
    amount_due: Number(row.amountDue),
    amount_paid: Number(row.amountPaid),
    currency: row.currency,
    plan_tier: row.planTier ?? null,
    description: row.description ?? null,
    pdf_url: row.pdfUrl ?? null,
    hosted_url: row.hostedUrl ?? null,
    period_start: dateToIso(row.periodStart),
    period_end: dateToIso(row.periodEnd),
    paid_at: dateToIso(row.paidAt),
    created_at: dateToIso(row.createdAt) ?? new Date().toISOString(),
  };
}

export const invoiceModel = {
  async createFromStripe(data: {
    clientId: string;
    stripeInvoiceId: string;
    stripeSubscriptionId?: string | null;
    invoiceNumber?: string | null;
    status: InvoiceStatus;
    amountDue: number;
    amountPaid: number;
    currency: string;
    planTier?: string | null;
    description?: string | null;
    pdfUrl?: string | null;
    hostedUrl?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    paidAt?: Date | null;
  }): Promise<Invoice> {
    const id = crypto.randomUUID();
    const now = new Date();

    await db
      .insert(invoices)
      .values({
        id,
        clientId: data.clientId,
        stripeInvoiceId: data.stripeInvoiceId,
        stripeSubscriptionId: data.stripeSubscriptionId ?? undefined,
        invoiceNumber: data.invoiceNumber ?? undefined,
        status: data.status,
        amountDue: String(data.amountDue / 100),
        amountPaid: String(data.amountPaid / 100),
        currency: data.currency,
        planTier: (data.planTier as typeof invoices.$inferInsert.planTier) ?? undefined,
        description: data.description ?? undefined,
        pdfUrl: data.pdfUrl ?? undefined,
        hostedUrl: data.hostedUrl ?? undefined,
        periodStart: data.periodStart ?? undefined,
        periodEnd: data.periodEnd ?? undefined,
        paidAt: data.paidAt ?? undefined,
        createdAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          status: data.status,
          amountPaid: String(data.amountPaid / 100),
          pdfUrl: data.pdfUrl ?? sql`${invoices.pdfUrl}`,
          hostedUrl: data.hostedUrl ?? sql`${invoices.hostedUrl}`,
          paidAt: data.paidAt ?? sql`${invoices.paidAt}`,
        },
      });

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeInvoiceId, data.stripeInvoiceId))
      .limit(1);

    if (!rows[0]) throw new Error("Failed to create invoice record.");
    return rowToInvoice(rows[0]);
  },

  async listByClient(clientId: string, limit = 24): Promise<Invoice[]> {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    return rows.map(rowToInvoice);
  },

  async findById(id: string): Promise<Invoice | null> {
    const rows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return rows[0] ? rowToInvoice(rows[0]) : null;
  },

  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<Invoice | null> {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
      .limit(1);

    return rows[0] ? rowToInvoice(rows[0]) : null;
  },
};

import { db, sql } from "@/lib/db/mysql";
import {
  auditLogs,
  depositBatches,
  invoices,
  subscriptions,
  usageEvents,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

// ---- Subscription ----
export type Subscription = {
  id: string;
  client_id: string;
  stripe_subscription_id: string;
  plan_tier: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  current_period_start: string;
  current_period_end: string;
};

function rowToSubscription(row: typeof subscriptions.$inferSelect): Subscription {
  return {
    id: row.id,
    client_id: row.clientId,
    stripe_subscription_id: row.stripeSubscriptionId,
    plan_tier: row.planTier,
    status: row.status as any,
    current_period_start: (row.currentPeriodStart as Date).toISOString(),
    current_period_end: (row.currentPeriodEnd as Date).toISOString(),
  };
}

export const subscriptionModel = {
  async upsert(data: Partial<Subscription>) {
    const now = new Date();
    await db
      .insert(subscriptions)
      .values({
        id: data.id!,
        clientId: data.client_id!,
        stripeSubscriptionId: data.stripe_subscription_id!,
        planTier: data.plan_tier!,
        status: data.status as any,
        currentPeriodStart: new Date(data.current_period_start!),
        currentPeriodEnd: new Date(data.current_period_end!),
        createdAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          status: (data.status as any) ?? sql`${subscriptions.status}`,
          currentPeriodStart: data.current_period_start
            ? new Date(data.current_period_start)
            : sql`${subscriptions.currentPeriodStart}`,
          currentPeriodEnd: data.current_period_end
            ? new Date(data.current_period_end)
            : sql`${subscriptions.currentPeriodEnd}`,
        },
      });

    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, data.stripe_subscription_id!))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to upsert subscription");
    return rowToSubscription(rows[0]);
  },

  async findByClient(clientId: string) {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clientId, clientId))
      .limit(1);
    return rows[0] ? rowToSubscription(rows[0]) : null;
  },
};

// ---- Usage Event ----
export type UsageEvent = {
  id: string;
  client_id: string;
  event_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
};

function rowToUsageEvent(row: typeof usageEvents.$inferSelect): UsageEvent {
  return {
    id: row.id,
    client_id: row.clientId,
    event_type: row.eventType,
    quantity: row.quantity,
    unit_cost: Number(row.unitCost),
    total_cost: Number(row.totalCost),
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const usageEventModel = {
  async create(data: Partial<UsageEvent>) {
    const toInsert: typeof usageEvents.$inferInsert = {
      id: data.id!,
      clientId: data.client_id!,
      eventType: data.event_type!,
      quantity: data.quantity!,
      unitCost: String(data.unit_cost!),
      totalCost: String(data.total_cost!),
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(usageEvents).values(toInsert);
    const rows = await db
      .select()
      .from(usageEvents)
      .where(eq(usageEvents.id, toInsert.id))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to create usage event");
    return rowToUsageEvent(rows[0]);
  },

  async sumByClient(clientId: string, from?: string, to?: string) {
    const whereParts = [eq(usageEvents.clientId, clientId)];
    if (from) whereParts.push(sql`${usageEvents.createdAt} >= ${new Date(from)}`);
    if (to) whereParts.push(sql`${usageEvents.createdAt} <= ${new Date(to)}`);

    const rows = await db
      .select({
        event_type: usageEvents.eventType,
        quantity: usageEvents.quantity,
        total_cost: usageEvents.totalCost,
      })
      .from(usageEvents)
      .where(and(...whereParts));

    return rows.map((r) => ({
      event_type: r.event_type,
      quantity: r.quantity,
      total_cost: Number(r.total_cost),
    }));
  },
};

// ---- Invoice ----
export type Invoice = {
  id: string;
  client_id: string;
  stripe_invoice_id: string;
  amount: number;
  pdf_url: string | null;
  status: string;
  created_at: string;
};

function rowToInvoice(row: typeof invoices.$inferSelect): Invoice {
  return {
    id: row.id,
    client_id: row.clientId,
    stripe_invoice_id: row.stripeInvoiceId,
    amount: Number(row.amount),
    pdf_url: row.pdfUrl ?? null,
    status: row.status,
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const invoiceModel = {
  async create(data: Partial<Invoice>) {
    const toInsert: typeof invoices.$inferInsert = {
      id: data.id!,
      clientId: data.client_id!,
      stripeInvoiceId: data.stripe_invoice_id!,
      amount: String(data.amount!),
      pdfUrl: data.pdf_url ?? undefined,
      status: data.status!,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(invoices).values(toInsert);
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, toInsert.id))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to create invoice");
    return rowToInvoice(rows[0]);
  },

  async listByClient(clientId: string) {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt));
    return rows.map(rowToInvoice);
  },
};

// ---- Audit Log (append-only) ----
export type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address: string | null;
  created_at: string;
};

export const auditLogModel = {
  async append(data: Omit<AuditLog, "id" | "created_at">) {
    const toInsert: typeof auditLogs.$inferInsert = {
      id: crypto.randomUUID(),
      actorId: data.actor_id,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      details: data.details ?? {},
      ipAddress: data.ip_address ?? undefined,
      createdAt: new Date(),
    };
    await db.insert(auditLogs).values(toInsert);
  },
};

// ---- Deposit Batch ----
export type DepositBatch = {
  id: string;
  batch_date: string;
  total_amount: number;
  cheque_count: number;
  bank_reference: string | null;
  deposit_slip_url: string | null;
  status: "pending" | "deposited" | "confirmed";
  created_by: string;
  created_at: string;
};

function rowToDepositBatch(row: typeof depositBatches.$inferSelect): DepositBatch {
  return {
    id: row.id,
    batch_date: row.batchDate,
    total_amount: Number(row.totalAmount),
    cheque_count: row.chequeCount,
    bank_reference: row.bankReference ?? null,
    deposit_slip_url: row.depositSlipUrl ?? null,
    status: row.status as any,
    created_by: row.createdBy,
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const depositBatchModel = {
  async create(data: Partial<DepositBatch>) {
    const toInsert: typeof depositBatches.$inferInsert = {
      id: data.id!,
      batchDate: data.batch_date!,
      totalAmount: String(data.total_amount!),
      chequeCount: data.cheque_count!,
      bankReference: data.bank_reference ?? undefined,
      depositSlipUrl: data.deposit_slip_url ?? undefined,
      status: (data.status as any) ?? "pending",
      createdBy: data.created_by!,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(depositBatches).values(toInsert);
    const rows = await db
      .select()
      .from(depositBatches)
      .where(eq(depositBatches.id, toInsert.id))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to create deposit batch");
    return rowToDepositBatch(rows[0]);
  },

  async update(id: string, data: Partial<DepositBatch>) {
    const patch: Partial<typeof depositBatches.$inferInsert> = {};
    if (data.batch_date !== undefined) patch.batchDate = data.batch_date;
    if (data.total_amount !== undefined) patch.totalAmount = String(data.total_amount);
    if (data.cheque_count !== undefined) patch.chequeCount = data.cheque_count;
    if (data.bank_reference !== undefined) patch.bankReference = data.bank_reference ?? undefined;
    if (data.deposit_slip_url !== undefined) patch.depositSlipUrl = data.deposit_slip_url ?? undefined;
    if (data.status !== undefined) patch.status = data.status as any;
    if (data.created_by !== undefined) patch.createdBy = data.created_by;

    await db.update(depositBatches).set(patch).where(eq(depositBatches.id, id));
    const rows = await db
      .select()
      .from(depositBatches)
      .where(eq(depositBatches.id, id))
      .limit(1);
    if (!rows[0]) throw new Error("Deposit batch not found");
    return rowToDepositBatch(rows[0]);
  },

  async list() {
    const rows = await db
      .select()
      .from(depositBatches)
      .orderBy(desc(depositBatches.batchDate));
    return rows.map(rowToDepositBatch);
  },
};

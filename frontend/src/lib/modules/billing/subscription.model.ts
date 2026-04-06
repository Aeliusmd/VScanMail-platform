import { db, sql } from "../core/db/mysql";
import { subscriptions } from "../core/db/schema";
import { eq } from "drizzle-orm";

export type Subscription = {
  id: string;
  client_id: string;
  stripe_customer_id: string | null;
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
    stripe_customer_id: row.stripeCustomerId ?? null,
    stripe_subscription_id: row.stripeSubscriptionId ?? "",
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
        planTier: data.plan_tier as any,
        status: data.status as any,
        currentPeriodStart: new Date(data.current_period_start!),
        currentPeriodEnd: new Date(data.current_period_end!),
        createdAt: now,
        updatedAt: now,
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
          updatedAt: now,
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

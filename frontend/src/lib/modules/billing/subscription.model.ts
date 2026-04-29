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
  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
    return rows[0] ? rowToSubscription(rows[0]) : null;
  },

  async upsert(data: Partial<Subscription>) {
    const existingByStripe = data.stripe_subscription_id
      ? await this.findByStripeSubscriptionId(data.stripe_subscription_id)
      : null;
    const existingByClient =
      !existingByStripe && data.client_id
        ? await this.findByClient(data.client_id)
        : null;
    const existing = existingByStripe || existingByClient;

    const id = data.id || existing?.id || crypto.randomUUID();
    const clientId = data.client_id || existing?.client_id;
    const stripeSubscriptionId =
      data.stripe_subscription_id || existing?.stripe_subscription_id;
    const planTier = data.plan_tier || existing?.plan_tier || "starter";
    const status = (data.status || existing?.status || "trialing") as any;
    const currentPeriodStart =
      data.current_period_start || existing?.current_period_start;
    const currentPeriodEnd = data.current_period_end || existing?.current_period_end;

    if (!clientId) throw new Error("client_id is required to upsert subscription");
    if (!stripeSubscriptionId) {
      throw new Error("stripe_subscription_id is required to upsert subscription");
    }
    if (!currentPeriodStart || !currentPeriodEnd) {
      throw new Error("Subscription period dates are required");
    }

    const now = new Date();
    await db
      .insert(subscriptions)
      .values({
        id,
        clientId,
        stripeCustomerId:
          data.stripe_customer_id ?? existing?.stripe_customer_id ?? undefined,
        stripeSubscriptionId,
        planTier: planTier as any,
        status,
        currentPeriodStart: new Date(currentPeriodStart),
        currentPeriodEnd: new Date(currentPeriodEnd),
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          clientId,
          stripeCustomerId:
            data.stripe_customer_id ?? sql`${subscriptions.stripeCustomerId}`,
          planTier: (data.plan_tier as any) ?? sql`${subscriptions.planTier}`,
          status,
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
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
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

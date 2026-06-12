import { db, sql } from "../core/db/mysql";
import { billingPlans, subscriptions } from "../core/db/schema";
import { desc, eq } from "drizzle-orm";
import { usageEventModel } from "./usage.model";

export type QuotaCheckResult = {
  allowed: boolean;
  reason?: string;
  used: number;
  limit: number;
};

export const quotaService = {
  async checkScanAllowed(clientId: string): Promise<QuotaCheckResult> {
    try {
      const [sub] = await db
        .select({
          planTier: subscriptions.planTier,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
        })
        .from(subscriptions)
        .where(eq(subscriptions.clientId, clientId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      // No subscription — fail open (don't block unsubscribed clients)
      if (!sub) return { allowed: true, used: 0, limit: 0 };

      // Blocked account — hard deny
      if (sub.status === "blocked") {
        return {
          allowed: false,
          reason: "Account suspended. Please contact support to restore access.",
          used: 0,
          limit: 0,
        };
      }

      // Non-enforced statuses (past_due, paused, canceled, trialing) — fail open
      if (sub.status !== "active") {
        return { allowed: true, used: 0, limit: 0 };
      }

      // Look up plan limits (case-insensitive name match: "starter" → "Starter")
      const [plan] = await db
        .select({ maxScans: billingPlans.maxScans })
        .from(billingPlans)
        .where(sql`LOWER(${billingPlans.name}) = LOWER(${sub.planTier})`)
        .limit(1);

      // Plan not found — fail open
      if (!plan) return { allowed: true, used: 0, limit: 0 };

      // Unlimited plan (0 or sentinel value)
      if (plan.maxScans <= 0 || plan.maxScans >= 999999) {
        return { allowed: true, used: 0, limit: plan.maxScans };
      }

      // Count scans used this billing period
      if (!sub.currentPeriodStart) {
        console.warn("[quotaService] currentPeriodStart missing for client", clientId);
        return { allowed: true, used: 0, limit: 0 };
      }
      const d = sub.currentPeriodStart as Date;
      const periodStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rows = await usageEventModel.sumByClient(clientId, periodStart);
      const used = rows
        .filter((r) => r.event_type === "scan")
        .reduce((acc, r) => acc + r.quantity, 0);

      const limit = plan.maxScans;

      if (used >= limit) {
        return {
          allowed: false,
          reason: `Monthly scan limit reached (${used}/${limit} scans used this billing period). Please upgrade your plan.`,
          used,
          limit,
        };
      }

      return { allowed: true, used, limit };
    } catch (err) {
      // Fail open — quota service error must never break the scan flow
      console.error("[quotaService.checkScanAllowed] error, failing open:", err);
      return { allowed: true, used: 0, limit: 0 };
    }
  },
};

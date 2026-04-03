import type { CustomerBillingResponse, SubscriptionPlanDetails } from "./customerBilling";

export type PlanPick = {
  id: string;
  name: string;
  price: string;
  period: string;
};

function subscriptionDetailsFromPlan(plan: PlanPick, previous: CustomerBillingResponse): SubscriptionPlanDetails {
  const scanLimits: Record<string, number> = {
    starter: 100,
    professional: 500,
    enterprise: 10000,
  };
  const limit = scanLimits[plan.id] ?? 500;
  const carried = Math.min(previous.manual.scansUsed, limit);

  const nextBill = new Date();
  nextBill.setMonth(nextBill.getMonth() + 1);
  const nextBillingDate = nextBill.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const titleLine =
    plan.price === "Custom"
      ? `${plan.name} — Custom pricing`
      : `${plan.name} — ${plan.price}${plan.period}`;

  return {
    planLabel: `${plan.name} Plan`,
    titleLine,
    nextBillingDate,
    scansUsed: carried,
    scansLimit: limit,
    mailsReceived: previous.manual.mailsReceived,
    chequesProcessed: previous.manual.chequesProcessed,
  };
}

/** Session-only subscription view; resets to manual on full page refresh. */
export function buildBillingSubscriptionState(
  previous: CustomerBillingResponse,
  plan: PlanPick
): CustomerBillingResponse {
  return {
    ...previous,
    planType: "subscription",
    subscription: subscriptionDetailsFromPlan(plan, previous),
  };
}

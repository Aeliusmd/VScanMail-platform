export type PlanType = "manual" | "subscription";

export type ManualPlanDetails = {
  planName: string;
  status: string;
  notes: string;
  startDate: string;
  renewalDate: string;
  assignedAdmin: string;
  scansUsed: number;
  scansLimit: number;
  mailsReceived: number;
  chequesProcessed: number;
};

export type SubscriptionPlanDetails = {
  planLabel: string;
  titleLine: string;
  nextBillingDate: string;
  scansUsed: number;
  scansLimit: number;
  mailsReceived: number;
  chequesProcessed: number;
};

export type CustomerBillingResponse = {
  planType: PlanType;
  manual: ManualPlanDetails;
  subscription: SubscriptionPlanDetails;
};

/** Shown if the API is unreachable (dev / offline). */
export const FALLBACK_BILLING: CustomerBillingResponse = {
  planType: "manual",
  manual: {
    planName: "Enterprise (Manual)",
    status: "Active",
    notes: "Your plan is managed directly by your VScan Mail administrator.",
    startDate: "Jan 15, 2024",
    renewalDate: "Jul 15, 2026",
    assignedAdmin: "Sarah Chen",
    scansUsed: 142,
    scansLimit: 500,
    mailsReceived: 89,
    chequesProcessed: 12,
  },
  subscription: {
    planLabel: "Professional Plan",
    titleLine: "Professional — $149/mo",
    nextBillingDate: "Apr 22, 2026",
    scansUsed: 312,
    scansLimit: 500,
    mailsReceived: 248,
    chequesProcessed: 19,
  },
};

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function fetchCustomerBilling(companyId = "demo"): Promise<CustomerBillingResponse> {
  const url = `${apiBase()}/api/customer/billing?companyId=${encodeURIComponent(companyId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Billing request failed (${res.status})`);
  }
  return res.json() as Promise<CustomerBillingResponse>;
}

export async function postBillingUpgradeRequest(
  planId: string,
  companyId = "demo"
): Promise<void> {
  const res = await fetch(`${apiBase()}/api/customer/billing/upgrade-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, planId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upgrade request failed (${res.status})`);
  }
}

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

export type BillingContactSettings = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export type CustomerBillingResponse = {
  planType: PlanType;
  manual: ManualPlanDetails;
  subscription: SubscriptionPlanDetails;
  contactSettings: BillingContactSettings;
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
  contactSettings: {
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  },
};

import { apiClient } from "./api-client";

export async function fetchCustomerBilling(): Promise<CustomerBillingResponse> {
  return apiClient<CustomerBillingResponse>("/api/customer/billing", { cache: "no-store" });
}

export async function postBillingUpgradeRequest(
  planId: string,
): Promise<void> {
  await apiClient("/api/customer/billing/upgrade-request", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

import { apiClient } from "../api-client";

export interface UsageBreakdownItem {
  quantity: number;
  cost: number;
}

export interface UsageSummary {
  breakdown: Record<string, UsageBreakdownItem>;
  totalCost: number;
}

export interface Invoice {
  id: string;
  stripe_invoice_id: string | null;
  amount: number;
  pdf_url: string | null;
  status: string;
  created_at: string;
}

export interface BillingStatus {
  status: "none" | "active" | "past_due" | "canceled" | "trialing" | "paused" | "blocked";
  planTier: "starter" | "professional" | "enterprise" | null;
  currentPeriodEnd?: string | null;
  gracePeriodUntil: string | null;
  isInGracePeriod: boolean;
  graceExpired: boolean;
  failedPaymentCount: number;
}

export interface StripePortalResponse {
  url: string;
}

export interface ChangeSubscriptionResponse {
  planTier: "starter" | "professional" | "enterprise";
  status: string;
}

export const billingApi = {
  getUsage: (params?: { from?: string; to?: string }) =>
    apiClient<UsageSummary>(
      `/api/billing/usage?${new URLSearchParams(
        Object.entries(params || {}).reduce((acc, [k, v]) => {
          if (!v) return acc;
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      )}`
    ),

  getInvoices: () =>
    apiClient<{ invoices: Invoice[] }>(`/api/billing/invoices`),

  getStatus: () =>
    apiClient<BillingStatus>(`/api/customer/billing/status`, { cache: "no-store" }),

  changeSubscription: (body: {
    planId: "starter" | "professional" | "enterprise";
    prorationBehavior?: "always_invoice" | "none";
  }) =>
    apiClient<ChangeSubscriptionResponse>(
      `/api/customer/billing/subscription`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    ),

  openStripePortal: () =>
    apiClient<StripePortalResponse>(`/api/billing/stripe/portal`, { method: "POST" }),
};


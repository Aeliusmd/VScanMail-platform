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

  openStripePortal: () =>
    apiClient<any>(`/api/billing/stripe/portal`, { method: "POST" }),
};


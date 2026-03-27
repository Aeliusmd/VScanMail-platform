import { apiClient } from "../api-client";

export interface Client {
  id: string;
  client_code: string;
  company_name: string;
  registration_no: string | null;
  industry: string;
  email: string;
  phone: string;
  address_json: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  stripe_customer_id: string | null;
  plan_type: "subscription" | "topup";
  plan_tier: "starter" | "professional" | "enterprise" | null;
  wallet_balance: number;
  status: "active" | "suspended" | "pending";
  two_fa_enabled: boolean;
  two_fa_secret: string | null;
  created_at: string;
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
}

export const companyApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient<ClientListResponse>(
      `/api/clients?${new URLSearchParams(
        Object.entries(params || {}).reduce((acc, [k, v]) => {
          if (v === undefined || v === null) return acc;
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      )}`
    ),
  getById: (id: string) => apiClient<Client>(`/api/clients/${id}`),
  update: (id: string, data: Partial<Client>) =>
    apiClient<Client>(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};


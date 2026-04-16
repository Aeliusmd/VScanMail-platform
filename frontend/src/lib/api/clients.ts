import { apiClient } from "../api-client";

export interface ManualCompany {
  id: string;           // manually_added_clients.id (for subscription PATCH)
  directoryId: string;  // company_directory.id
  name: string;
  initial: string;
  avatarColor: string;
  industry: string;
  industryBadge: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  status: "Active" | "Pending" | "Inactive";
  mails: number;
  cheques: number;
  chequeValue: number;
  notes: string;
  joined: string;
  time: string;
  lastActivity: string;
  paymentType: string;
  subscriptionPlan: string;
  subscriptionAmount: number;
  subscriptionStatus: string;
  isManuallyAdded: boolean;
}

export interface AddCompanyInput {
  companyName: string;
  industry: string;
  email: string;
  phone?: string;
  status?: "active" | "pending";
  website?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  paymentType?: "cash" | "bank_transfer" | "cheque" | "other";
}

export interface UpdateSubscriptionInput {
  subscriptionPlan: "starter" | "professional" | "enterprise" | "custom" | "none";
  subscriptionAmount: number;
  subscriptionStatus: "active" | "pending" | "suspended";
}

export interface ClientDirectoryItem {
  id: string;
  client_code: string;
  table_name: string;
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
  client_type: "subscription" | "manual";
  status: "active" | "suspended" | "pending" | "inactive";
  two_fa_enabled: boolean;
  added_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const clientsApi = {
  list: (page = 1, limit = 100) =>
    apiClient<{ clients: ClientDirectoryItem[]; total: number }>(
      `/api/clients?page=${page}&limit=${limit}`
    ),
};

export const companiesApi = {
  listManual: (page = 1, limit = 50) =>
    apiClient<{ companies: ManualCompany[]; total: number }>(
      `/api/clients/manual?page=${page}&limit=${limit}`
    ),

  addManual: (data: AddCompanyInput) =>
    apiClient<{ company: ManualCompany }>("/api/clients/manual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubscription: (macId: string, data: UpdateSubscriptionInput) =>
    apiClient<{ success: boolean; company: ManualCompany }>(
      `/api/clients/manual/${macId}/subscription`,
      { method: "PATCH", body: JSON.stringify(data) }
    ),
};
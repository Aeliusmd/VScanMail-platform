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

export const companiesApi = {
  listManual: (page = 1, limit = 50) =>
    apiClient<{ companies: ManualCompany[]; total: number }>(
      `/api/companies/manual?page=${page}&limit=${limit}`
    ),

  addManual: (data: AddCompanyInput) =>
    apiClient<{ company: ManualCompany }>("/api/companies/manual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubscription: (macId: string, data: UpdateSubscriptionInput) =>
    apiClient<{ success: boolean; company: ManualCompany }>(
      `/api/companies/manual/${macId}/subscription`,
      { method: "PATCH", body: JSON.stringify(data) }
    ),
};

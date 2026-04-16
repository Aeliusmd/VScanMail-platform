import { apiClient, apiUpload } from "../api-client";

export type ChequeClientDecision = "pending" | "approved" | "rejected";
export type ChequeStatus =
  | "validated"
  | "flagged"
  | "approved"
  | "deposited"
  | "cleared";

export interface Cheque {
  id: string;
  mail_item_id: string;
  amount_figures: number | null;
  beneficiary: string;
  date_on_cheque: string | null;
  client_decision: ChequeClientDecision;
  status: ChequeStatus;
  ai_confidence: number;
  ai_raw_result: any;
  decided_by: string | null;
  decided_at: string | null;
  deposit_batch_id: string | null;
  created_at: string;
  company_name?: string;
}

export interface ChequeListResponse {
  cheques: Cheque[];
  total: number;
}

export const chequeApi = {
  list: (params?: {
    archived?: boolean;
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.archived !== undefined) qs.set("archived", String(params.archived));
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.clientId) qs.set("clientId", params.clientId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient<ChequeListResponse>(`/api/records/cheques${suffix}`);
  },
  getById: (id: string) => apiClient<any>(`/api/records/cheques/${id}`),
  approve: (id: string, reason?: string) =>
    apiClient<any>(`/api/records/cheques/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  reject: (id: string, reason: string) =>
    apiClient<any>(`/api/records/cheques/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  validate: (formData: FormData) =>
    apiClient<any>(`/api/ai/validate-cheque`, {
      method: "POST",
      body: formData as any,
    }),
  resend: (id: string) =>
    apiClient<any>(`/api/records/cheques/${id}/resend`, { method: "POST" }),
  download: (id: string) =>
    apiClient<any>(`/api/records/cheques/${id}/download`, { method: "GET" }),
};

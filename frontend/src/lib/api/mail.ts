import { apiClient, apiUpload } from "../api-client";

export type MailType = "letter" | "cheque" | "package" | "legal";
export type MailStatus = "received" | "scanned" | "processed" | "delivered";
export type AiRiskLevel = "low" | "medium" | "high" | "critical";

export interface MailItem {
  id: string;
  client_id: string;
  irn: string;
  type: MailType;
  envelope_front_url: string | null;
  envelope_back_url: string | null;
  content_scan_urls: string[];
  tamper_detected: boolean;
  tamper_annotations: any;
  ocr_text: string | null;
  ai_summary: string | null;
  ai_actions: any;
  ai_risk_level: AiRiskLevel | null;
  retention_until: string | null;
  scanned_by: string | null;
  scanned_at: string | null;
  status: MailStatus;
  created_at: string;
}

export interface MailListResponse {
  items: MailItem[];
  total: number;
}

export const mailApi = {
  list: (params?: {
    status?: MailStatus;
    page?: number;
    limit?: number;
    type?: MailType;
    search?: string;
    clientId?: string; // ignored by backend for non-admin
  }) =>
    apiClient<MailListResponse>(
      `/api/records/mail?${new URLSearchParams(
        Object.entries(params || {}).reduce((acc, [k, v]) => {
          if (v === undefined || v === null) return acc;
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      )}`
    ),

  getById: (id: string) => apiClient<MailItem>(`/api/records/mail/${id}`),

  upload: (formData: FormData) =>
    apiUpload<{ id: string }>(`/api/records/mail/upload`, formData),

  annotate: (id: string, body: { annotations: any; tamperDetected: boolean; tamperNotes?: string }) =>
    apiClient<any>(`/api/records/mail/${id}/annotate`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resend: (id: string) => apiClient<any>(`/api/records/mail/${id}/resend`, { method: "POST" }),

  setStatus: (id: string, status: MailStatus) =>
    apiClient<any>(`/api/records/mail/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  download: (id: string) => apiClient<any>(`/api/records/mail/${id}/download`, { method: "GET" }),
};


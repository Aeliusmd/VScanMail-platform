import { apiClient } from "../api-client";

export interface DepositBatch {
  id: string;
  batch_date: string;
  total_amount: number;
  cheque_count: number;
  bank_reference: string | null;
  deposit_slip_url: string | null;
  status: "pending" | "deposited" | "confirmed";
  created_by: string;
  created_at: string;
  company_name?: string | null;
  email?: string | null;
}

export const depositApi = {
  listBatches: () => apiClient<{ batches: DepositBatch[] }>(`/api/deposits/batches`),
  updateBatchStatus: (id: string, status: string, bankReference?: string) =>
    apiClient<DepositBatch>(`/api/deposits/batches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, bankReference }),
    } as any),
  createBatch: (chequeIds: string[], bankReference?: string) =>
    apiClient<any>(`/api/deposits/batches`, {
      method: "POST",
      body: JSON.stringify({ chequeIds, bankReference }),
    } as any),
  resendBatch: (id: string) =>
    apiClient<any>(`/api/deposits/batches/${id}/resend`, { method: "POST" }),
};


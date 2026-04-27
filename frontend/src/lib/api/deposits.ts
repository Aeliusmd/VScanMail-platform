import { apiClient, apiUpload } from "../api-client";

export type DepositDecision = "pending" | "approved" | "rejected";

export type DepositDto = {
  chequeId: string;
  mailItemId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  amountFigures: number;
  createdAt: string;

  chequeStatus: string | null;
  requestedAt: string | null;
  requestedBy: string | null;

  destinationBankAccountId: string | null;
  destinationBankName: string | null;
  destinationBankNickname: string | null;
  destinationBankLast4: string | null;

  decision: DepositDecision | null;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectReason: string | null;

  markedDepositedAt: string | null;
  markedDepositedBy: string | null;

  slipUrl?: string | null;
  slipUploadedAt?: string | null;
  slipUploadedBy?: string | null;
  slipAiResult?: any | null;

  aiSummary: string | null;
};

export const depositsApi = {
  requestDeposit: async (chequeId: string, destinationBankAccountId: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/records/cheques/${chequeId}/deposit`, {
      method: "POST",
      body: JSON.stringify({ destinationBankAccountId }),
    });
  },

  cancelRequest: async (chequeId: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/records/cheques/${chequeId}/deposit`, {
      method: "DELETE",
    });
  },

  listMine: async (): Promise<DepositDto[]> => {
    const res = await apiClient<{ deposits: DepositDto[] }>(`/api/customer/deposits`, {
      method: "GET",
    });
    return res.deposits || [];
  },

  adminList: async (): Promise<DepositDto[]> => {
    const res = await apiClient<{ deposits: DepositDto[] }>(`/api/admin/deposits`, {
      method: "GET",
    });
    return res.deposits || [];
  },

  adminApprove: async (chequeId: string, depositDate?: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deposits/${chequeId}/approve`, {
      method: "POST",
      body: JSON.stringify({ depositDate }),
    });
  },

  adminReject: async (chequeId: string, reason: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deposits/${chequeId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  adminMarkDeposited: async (chequeId: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deposits/${chequeId}/mark-deposited`, {
      method: "POST",
    });
  },

  revealAccount: async (chequeId: string): Promise<{
    bankName: string;
    nickname: string;
    accountType: string;
    accountNumber: string;
    accountLast4: string;
  }> => {
    return apiClient(`/api/admin/deposits/${chequeId}/reveal-account`, { method: "GET" });
  },

  adminUploadSlip: async (
    chequeId: string,
    file: File
  ): Promise<{ slipUrl: string; aiResult: any }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<{ slipUrl: string; aiResult: any }>(
      `/api/admin/deposits/${chequeId}/slip`,
      formData
    );
  },
};


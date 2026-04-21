import { apiClient } from "../api-client";

export type BankAccountType = "checking" | "savings";

export type BankAccountListItem = {
  id: string;
  clientId: string;
  bankName: string;
  nickname: string;
  accountType: BankAccountType;
  accountLast4: string;
  isPrimary: boolean;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export const bankAccountsApi = {
  list: async (): Promise<BankAccountListItem[]> => {
    const res = await apiClient<{ bankAccounts: BankAccountListItem[] }>(
      "/api/customer/bank-accounts",
      { method: "GET" }
    );
    return res.bankAccounts || [];
  },

  create: async (input: {
    bankName: string;
    nickname: string;
    accountType: BankAccountType;
    accountNumber: string;
    isPrimary?: boolean;
  }): Promise<BankAccountListItem> => {
    const res = await apiClient<{ bankAccount: BankAccountListItem }>(
      "/api/customer/bank-accounts",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return res.bankAccount;
  },

  setPrimary: async (id: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/customer/bank-accounts/${id}/primary`, {
      method: "PATCH",
    });
  },

  remove: async (id: string, password: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/customer/bank-accounts/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  },
};


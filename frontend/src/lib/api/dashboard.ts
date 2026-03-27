import { apiClient } from "../api-client";

export type DashboardStatsResponse = {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalMails: number;
  totalCheques: number;
  activeCompanies: number;
  pendingRequests: number;
};

export const dashboardApi = {
  getStats: () => apiClient<DashboardStatsResponse>("/api/reports/intake"),
};


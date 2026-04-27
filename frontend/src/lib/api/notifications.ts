import { apiClient } from "../api-client";

export type AdminNotification = {
  id: string;
  action: string;
  entityId: string;
  clientId: string | null;
  afterState: any;
  createdAt: string;
  notifTitle: string | null;
  notifTargetUrl: string | null;
  notifIsRead: boolean;
};

export const notificationsApi = {
  list: async (): Promise<AdminNotification[]> => {
    const res = await apiClient<{ notifications: AdminNotification[] }>(`/api/admin/notifications`, {
      method: "GET",
    });
    return res.notifications || [];
  },
  markRead: async (id: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/notifications/${id}/read`, {
      method: "PATCH",
    });
  },
  markAllRead: async (): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/notifications/read-all`, {
      method: "PATCH",
    });
  },
};

export const customerNotificationsApi = {
  list: async (): Promise<AdminNotification[]> => {
    const res = await apiClient<{ notifications: AdminNotification[] }>(`/api/customer/notifications`, {
      method: "GET",
    });
    return res.notifications || [];
  },
  markRead: async (id: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/customer/notifications/${id}/read`, {
      method: "PATCH",
    });
  },
  markAllRead: async (): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/customer/notifications/read-all`, {
      method: "PATCH",
    });
  },
};


import {
  DEFAULT_CLIENT_NOTIFICATION_PREFERENCES,
  notificationPreferencesModel,
} from "./notification-preferences.model";

export type ClientNotificationPreferencesShape = typeof DEFAULT_CLIENT_NOTIFICATION_PREFERENCES & {
  updatedAt: Date | null;
};

export const notificationPreferencesService = {
  async getForClient(clientId: string): Promise<ClientNotificationPreferencesShape> {
    const row = await notificationPreferencesModel.findByClientId(clientId);
    if (!row) {
      return { ...DEFAULT_CLIENT_NOTIFICATION_PREFERENCES, updatedAt: null };
    }

    return {
      emailEnabled: row.emailEnabled,
      newMailScanned: row.newMailScanned,
      newChequeScanned: row.newChequeScanned,
      deliveryUpdates: row.deliveryUpdates,
      depositUpdates: row.depositUpdates,
      weeklySummary: row.weeklySummary,
      updatedAt: row.updatedAt,
    };
  },
};


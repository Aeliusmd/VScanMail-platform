import { db } from "../core/db/mysql";
import { clientNotificationPreferences } from "../core/db/schema";
import { eq } from "drizzle-orm";

export type ClientNotificationPreferences = {
  clientId: string;
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
  updatedBy: string | null;
  updatedAt: Date;
};

export type ClientNotificationPreferencesUpsert = Omit<
  ClientNotificationPreferences,
  "updatedAt"
> & { updatedAt?: Date };

export const DEFAULT_CLIENT_NOTIFICATION_PREFERENCES: Omit<
  ClientNotificationPreferences,
  "clientId" | "updatedBy" | "updatedAt"
> = {
  emailEnabled: true,
  newMailScanned: true,
  newChequeScanned: true,
  deliveryUpdates: true,
  depositUpdates: false,
  weeklySummary: true,
};

function rowToPrefs(
  row: typeof clientNotificationPreferences.$inferSelect
): ClientNotificationPreferences {
  return {
    clientId: row.clientId,
    emailEnabled: row.emailEnabled,
    newMailScanned: row.newMailScanned,
    newChequeScanned: row.newChequeScanned,
    deliveryUpdates: row.deliveryUpdates,
    depositUpdates: row.depositUpdates,
    weeklySummary: row.weeklySummary,
    updatedBy: row.updatedBy ?? null,
    updatedAt: row.updatedAt as Date,
  };
}

export const notificationPreferencesModel = {
  async findByClientId(clientId: string) {
    const rows = await db
      .select()
      .from(clientNotificationPreferences)
      .where(eq(clientNotificationPreferences.clientId, clientId))
      .limit(1);

    return rows[0] ? rowToPrefs(rows[0]) : null;
  },

  async upsert(data: ClientNotificationPreferencesUpsert) {
    const now = data.updatedAt ?? new Date();

    await db
      .insert(clientNotificationPreferences)
      .values({
        clientId: data.clientId,
        emailEnabled: data.emailEnabled,
        newMailScanned: data.newMailScanned,
        newChequeScanned: data.newChequeScanned,
        deliveryUpdates: data.deliveryUpdates,
        depositUpdates: data.depositUpdates,
        weeklySummary: data.weeklySummary,
        updatedBy: data.updatedBy ?? null,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          emailEnabled: data.emailEnabled,
          newMailScanned: data.newMailScanned,
          newChequeScanned: data.newChequeScanned,
          deliveryUpdates: data.deliveryUpdates,
          depositUpdates: data.depositUpdates,
          weeklySummary: data.weeklySummary,
          updatedBy: data.updatedBy ?? null,
          updatedAt: now,
        },
      });

    const updated = await this.findByClientId(data.clientId);
    if (!updated) throw new Error("Failed to upsert notification preferences");
    return updated;
  },
};


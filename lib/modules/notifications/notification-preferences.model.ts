import { db } from "../core/db/mysql";
import { clientNotificationPreferences } from "../core/db/schema";
import { eq } from "drizzle-orm";

/** Keys stored in `billing_plans.features` (JSON string array). */
export const NOTIFICATION_PLAN_FEATURES = {
  MASTER: "email_notifications",
  NEW_MAIL: "email_new_mail",
  NEW_CHEQUE: "email_new_cheque",
  DELIVERY: "email_delivery",
  DEPOSIT: "email_deposit",
  WEEKLY: "email_weekly_summary",
} as const;

const NOTIFICATION_PLAN_FEATURE_LIST = Object.values(NOTIFICATION_PLAN_FEATURES);

export type NotificationCapabilities = {
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
};

const FULL_CAPABILITIES: NotificationCapabilities = {
  emailEnabled: true,
  newMailScanned: true,
  newChequeScanned: true,
  deliveryUpdates: true,
  depositUpdates: true,
  weeklySummary: true,
};

/**
 * Derives channel caps from plan `features[]`.
 * If none of the notification keys appear, treat as a legacy plan row and allow all channels (backward compatible).
 */
export function capabilitiesFromPlanFeatures(features: unknown): {
  capabilities: NotificationCapabilities;
  legacyPlan: boolean;
} {
  const list = Array.isArray(features) ? features.map((f) => String(f).toLowerCase()) : [];
  const set = new Set(list);
  const hasAnyNotificationKey = NOTIFICATION_PLAN_FEATURE_LIST.some((k) => set.has(k.toLowerCase()));
  if (!hasAnyNotificationKey) {
    return { legacyPlan: true, capabilities: { ...FULL_CAPABILITIES } };
  }
  const master = set.has(NOTIFICATION_PLAN_FEATURES.MASTER.toLowerCase());
  return {
    legacyPlan: false,
    capabilities: {
      emailEnabled: master,
      newMailScanned: master && set.has(NOTIFICATION_PLAN_FEATURES.NEW_MAIL.toLowerCase()),
      newChequeScanned: master && set.has(NOTIFICATION_PLAN_FEATURES.NEW_CHEQUE.toLowerCase()),
      deliveryUpdates: master && set.has(NOTIFICATION_PLAN_FEATURES.DELIVERY.toLowerCase()),
      depositUpdates: master && set.has(NOTIFICATION_PLAN_FEATURES.DEPOSIT.toLowerCase()),
      weeklySummary: master && set.has(NOTIFICATION_PLAN_FEATURES.WEEKLY.toLowerCase()),
    },
  };
}

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

export function clampPreferencesToCapabilities(
  prefs: Omit<ClientNotificationPreferences, "clientId" | "updatedBy" | "updatedAt">,
  caps: NotificationCapabilities
): Omit<ClientNotificationPreferences, "clientId" | "updatedBy" | "updatedAt"> {
  return {
    emailEnabled: prefs.emailEnabled && caps.emailEnabled,
    newMailScanned: prefs.newMailScanned && caps.newMailScanned,
    newChequeScanned: prefs.newChequeScanned && caps.newChequeScanned,
    deliveryUpdates: prefs.deliveryUpdates && caps.deliveryUpdates,
    depositUpdates: prefs.depositUpdates && caps.depositUpdates,
    weeklySummary: prefs.weeklySummary && caps.weeklySummary,
  };
}

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

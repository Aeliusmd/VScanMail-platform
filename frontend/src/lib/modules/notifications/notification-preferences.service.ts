import { eq } from "drizzle-orm";
import { db } from "../core/db/mysql";
import { billingPlans } from "../core/db/schema";
import { subscriptionModel } from "../billing/subscription.model";
import {
  DEFAULT_CLIENT_NOTIFICATION_PREFERENCES,
  clampPreferencesToCapabilities,
  capabilitiesFromPlanFeatures,
  notificationPreferencesModel,
} from "./notification-preferences.model";
import type { NotificationCapabilities } from "./notification-preferences.model";

const FULL_CAPS: NotificationCapabilities = {
  emailEnabled: true,
  newMailScanned: true,
  newChequeScanned: true,
  deliveryUpdates: true,
  depositUpdates: true,
  weeklySummary: true,
};

export type ClientNotificationPreferencesShape = typeof DEFAULT_CLIENT_NOTIFICATION_PREFERENCES & {
  updatedAt: Date | null;
};

export type ResolvedNotificationPreferences = {
  emailEnabled: boolean;
  newMailScanned: boolean;
  newChequeScanned: boolean;
  deliveryUpdates: boolean;
  depositUpdates: boolean;
  weeklySummary: boolean;
  capabilities: NotificationCapabilities;
  planTier: string | null;
  legacyPlan: boolean;
  updatedAt: Date | null;
};

async function loadCapabilitiesForClient(clientId: string): Promise<{
  capabilities: NotificationCapabilities;
  planTier: string | null;
  legacyPlan: boolean;
}> {
  const sub = await subscriptionModel.findByClient(clientId);
  if (!sub) {
    return { planTier: null, legacyPlan: true, capabilities: { ...FULL_CAPS } };
  }

  const planRows = await db
    .select({ features: billingPlans.features })
    .from(billingPlans)
    .where(eq(billingPlans.id, sub.plan_tier))
    .limit(1);

  if (!planRows[0]) {
    return { planTier: sub.plan_tier, legacyPlan: true, capabilities: { ...FULL_CAPS } };
  }

  const { capabilities, legacyPlan } = capabilitiesFromPlanFeatures(planRows[0].features);
  return { planTier: sub.plan_tier, legacyPlan, capabilities };
}

export const notificationPreferencesService = {
  /**
   * Effective prefs for outbound email (user prefs AND plan capabilities).
   */
  async getForClient(clientId: string): Promise<ClientNotificationPreferencesShape> {
    const resolved = await this.getResolvedForClient(clientId);
    return {
      emailEnabled: resolved.emailEnabled,
      newMailScanned: resolved.newMailScanned,
      newChequeScanned: resolved.newChequeScanned,
      deliveryUpdates: resolved.deliveryUpdates,
      depositUpdates: resolved.depositUpdates,
      weeklySummary: resolved.weeklySummary,
      updatedAt: resolved.updatedAt,
    };
  },

  async getResolvedForClient(clientId: string): Promise<ResolvedNotificationPreferences> {
    const row = await notificationPreferencesModel.findByClientId(clientId);
    const stored = row
      ? {
          emailEnabled: row.emailEnabled,
          newMailScanned: row.newMailScanned,
          newChequeScanned: row.newChequeScanned,
          deliveryUpdates: row.deliveryUpdates,
          depositUpdates: row.depositUpdates,
          weeklySummary: row.weeklySummary,
        }
      : { ...DEFAULT_CLIENT_NOTIFICATION_PREFERENCES };

    const { capabilities, planTier, legacyPlan } = await loadCapabilitiesForClient(clientId);
    const clamped = clampPreferencesToCapabilities(stored, capabilities);

    return {
      ...clamped,
      capabilities,
      planTier,
      legacyPlan,
      updatedAt: row?.updatedAt ?? null,
    };
  },

  async upsertWithCapabilities(
    clientId: string,
    payload: Omit<typeof DEFAULT_CLIENT_NOTIFICATION_PREFERENCES, never>,
    updatedBy: string | null
  ) {
    const { capabilities } = await loadCapabilitiesForClient(clientId);
    const clamped = clampPreferencesToCapabilities(payload, capabilities);

    return notificationPreferencesModel.upsert({
      clientId,
      ...clamped,
      updatedBy,
      updatedAt: new Date(),
    });
  },
};


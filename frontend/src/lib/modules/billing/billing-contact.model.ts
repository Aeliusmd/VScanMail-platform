import { db, sql } from "../core/db/mysql";
import { billingContactSettings } from "../core/db/schema";
import { eq } from "drizzle-orm";

export type BillingContactSettings = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

function rowToSettings(row: typeof billingContactSettings.$inferSelect): BillingContactSettings {
  return {
    contactName: row.contactName ?? "",
    contactPhone: row.contactPhone ?? "",
    contactEmail: row.contactEmail ?? "",
  };
}

export const billingContactModel = {
  async get(): Promise<BillingContactSettings> {
    const rows = await db.select().from(billingContactSettings).where(eq(billingContactSettings.id, 1)).limit(1);
    if (!rows[0]) {
      return { contactName: "", contactPhone: "", contactEmail: "" };
    }
    return rowToSettings(rows[0]);
  },

  async upsert(
    data: Partial<BillingContactSettings>,
    actorId: string | null
  ): Promise<BillingContactSettings> {
    const now = new Date();

    await db
      .insert(billingContactSettings)
      .values({
        id: 1,
        contactName: data.contactName ?? "",
        contactPhone: data.contactPhone ?? "",
        contactEmail: data.contactEmail ?? "",
        updatedBy: actorId,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          contactName:
            data.contactName !== undefined ? data.contactName : sql`${billingContactSettings.contactName}`,
          contactPhone:
            data.contactPhone !== undefined ? data.contactPhone : sql`${billingContactSettings.contactPhone}`,
          contactEmail:
            data.contactEmail !== undefined ? data.contactEmail : sql`${billingContactSettings.contactEmail}`,
          updatedBy: actorId,
          updatedAt: now,
        },
      });

    return this.get();
  },
};


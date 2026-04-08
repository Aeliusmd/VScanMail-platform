import { db } from "../core/db/mysql";
import { billingPlans } from "../core/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "../audit/audit.service";

export type BillingPlan = {
  id: string;
  name: string;
  price: number;
  max_companies: number;
  max_scans: number;
  storage: string;
  ai_magic?: string | null;
  cheque_handling?: string | null;
  badge?: string | null;
  badge_color?: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function rowToBillingPlan(row: typeof billingPlans.$inferSelect): BillingPlan {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    max_companies: row.maxCompanies,
    max_scans: row.maxScans,
    storage: row.storage,
    ai_magic: row.aiMagic,
    cheque_handling: row.chequeHandling,
    badge: row.badge,
    badge_color: row.badgeColor,
    features: row.features as string[],
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export const billingPlanModel = {
  async listAll() {
    const rows = await db.select().from(billingPlans).where(eq(billingPlans.isActive, true));
    return rows.map(rowToBillingPlan);
  },

  async findById(id: string) {
    const rows = await db.select().from(billingPlans).where(eq(billingPlans.id, id)).limit(1);
    if (!rows[0]) throw new Error("Billing plan not found");
    return rowToBillingPlan(rows[0]);
  },

  async update(id: string, data: Partial<BillingPlan>, actorId: string, req?: Request) {
    const before = await this.findById(id);

    const toUpdate: Partial<typeof billingPlans.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) toUpdate.name = data.name;
    if (data.price !== undefined) toUpdate.price = String(data.price);
    if (data.max_companies !== undefined) toUpdate.maxCompanies = data.max_companies;
    if (data.max_scans !== undefined) toUpdate.maxScans = data.max_scans;
    if (data.storage !== undefined) toUpdate.storage = data.storage;
    if (data.ai_magic !== undefined) toUpdate.aiMagic = data.ai_magic;
    if (data.cheque_handling !== undefined) toUpdate.chequeHandling = data.cheque_handling;
    if (data.badge !== undefined) toUpdate.badge = data.badge;
    if (data.badge_color !== undefined) toUpdate.badgeColor = data.badge_color;
    if (data.features !== undefined) toUpdate.features = data.features;

    await db.update(billingPlans).set(toUpdate).where(eq(billingPlans.id, id));

    const after = await this.findById(id);

    await auditService.log({
      actor: actorId,
      actor_role: "super_admin",
      action: "billing.plan_updated",
      entity: id,
      before,
      after,
      req,
    });

    return after;
  },
};

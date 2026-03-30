import { db, sql } from "@/lib/db/mysql";
import { clients } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type Client = {
  id: string;
  client_code: string;
  company_name: string;
  registration_no: string | null;
  industry: string;
  email: string;
  phone: string;
  address_json: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  stripe_customer_id: string | null;
  plan_type: "subscription" | "topup";
  plan_tier: "starter" | "professional" | "enterprise" | null;
  wallet_balance: number;
  status: "active" | "suspended" | "pending";
  two_fa_enabled: boolean;
  two_fa_secret: string | null;
  created_at: string;
};

function rowToClient(row: typeof clients.$inferSelect): Client {
  return {
    id: row.id,
    client_code: row.clientCode,
    company_name: row.companyName,
    registration_no: row.registrationNo ?? null,
    industry: row.industry,
    email: row.email,
    phone: row.phone,
    address_json: row.addressJson as any,
    stripe_customer_id: row.stripeCustomerId ?? null,
    plan_type: row.planType as any,
    plan_tier: (row.planTier as any) ?? null,
    wallet_balance: Number(row.walletBalance ?? 0),
    status: row.status as any,
    two_fa_enabled: Boolean(row.twoFaEnabled),
    two_fa_secret: row.twoFaSecret ?? null,
    created_at: new Date(row.createdAt as any).toISOString(),
  };
}

export const clientModel = {
  async create(data: Partial<Client>) {
    const toInsert: typeof clients.$inferInsert = {
      id: data.id!,
      clientCode: data.client_code!,
      companyName: data.company_name!,
      registrationNo: data.registration_no ?? undefined,
      industry: data.industry!,
      email: data.email!,
      phone: data.phone!,
      addressJson: data.address_json as any,
      stripeCustomerId: data.stripe_customer_id ?? undefined,
      planType: data.plan_type!,
      planTier: (data.plan_tier as any) ?? undefined,
      walletBalance: String(data.wallet_balance ?? 0),
      status: (data.status as any) ?? "pending",
      twoFaEnabled: Boolean(data.two_fa_enabled ?? false),
      twoFaSecret: data.two_fa_secret ?? undefined,
      createdAt: sql`NOW()` as any,
    };

    await db.insert(clients).values(toInsert);
    const rows = await db.select().from(clients).where(eq(clients.id, toInsert.id)).limit(1);
    if (!rows[0]) throw new Error("Failed to create client");
    return rowToClient(rows[0]);
  },

  async findById(id: string) {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (!rows[0]) throw new Error("Client not found");
    return rowToClient(rows[0]);
  },

  async findByEmail(email: string) {
    const rows = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
    return rows[0] ? rowToClient(rows[0]) : null;
  },

  async update(id: string, data: Partial<Client>) {
    const patch: Partial<typeof clients.$inferInsert> = {};
    if (data.client_code !== undefined) patch.clientCode = data.client_code;
    if (data.company_name !== undefined) patch.companyName = data.company_name;
    if (data.registration_no !== undefined) patch.registrationNo = data.registration_no ?? undefined;
    if (data.industry !== undefined) patch.industry = data.industry;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.address_json !== undefined) patch.addressJson = data.address_json as any;
    if (data.stripe_customer_id !== undefined) patch.stripeCustomerId = data.stripe_customer_id ?? undefined;
    if (data.plan_type !== undefined) patch.planType = data.plan_type;
    if (data.plan_tier !== undefined) patch.planTier = (data.plan_tier as any) ?? undefined;
    if (data.wallet_balance !== undefined) patch.walletBalance = String(data.wallet_balance);
    if (data.status !== undefined) patch.status = data.status as any;
    if (data.two_fa_enabled !== undefined) patch.twoFaEnabled = Boolean(data.two_fa_enabled);
    if (data.two_fa_secret !== undefined) patch.twoFaSecret = data.two_fa_secret ?? undefined;

    await db.update(clients).set(patch).where(eq(clients.id, id));
    return await this.findById(id);
  },

  async list(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const rows = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(from);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(sql`1=1`));

    return {
      clients: rows.map(rowToClient),
      total: Number(totalRows[0]?.count || 0),
    };
  },

  async updateWalletBalance(id: string, amount: number) {
    await db.transaction(async (tx) => {
      await tx
        .update(clients)
        .set({ walletBalance: sql`${clients.walletBalance} + ${amount}` })
        .where(eq(clients.id, id));
    });
  },
};

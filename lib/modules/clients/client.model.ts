import { db, sql } from "../core/db/mysql";
import { clients } from "../core/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type Client = {
  id: string;
  client_code: string;
  table_name: string;
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
  client_type: "subscription" | "manual";
  status: "active" | "suspended" | "pending" | "inactive";
  two_fa_enabled: boolean;
  two_fa_secret: string | null;
  added_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function rowToClient(row: typeof clients.$inferSelect): Client {
  return {
    id: row.id,
    client_code: row.clientCode,
    table_name: row.tableName,
    company_name: row.companyName,
    registration_no: row.registrationNo ?? null,
    industry: row.industry,
    email: row.email,
    phone: row.phone,
    address_json: row.addressJson as any,
    client_type: row.clientType as any,
    status: row.status as any,
    two_fa_enabled: Boolean(row.twoFaEnabled),
    two_fa_secret: row.twoFaSecret ?? null,
    added_by: row.addedBy ?? null,
    notes: row.notes ?? null,
    created_at: new Date(row.createdAt as any).toISOString(),
    updated_at: new Date(row.updatedAt as any).toISOString(),
  };
}

export const clientModel = {
  async create(data: Partial<Client>) {
    const toInsert: typeof clients.$inferInsert = {
      id: data.id!,
      clientCode: data.client_code!,
      tableName: data.table_name!,
      companyName: data.company_name!,
      registrationNo: data.registration_no ?? undefined,
      industry: data.industry!,
      email: data.email!,
      phone: data.phone!,
      addressJson: data.address_json as any,
      clientType: (data.client_type as any) ?? "subscription",
      status: (data.status as any) ?? "pending",
      twoFaEnabled: Boolean(data.two_fa_enabled ?? false),
      twoFaSecret: data.two_fa_secret ?? undefined,
      addedBy: data.added_by ?? undefined,
      notes: data.notes ?? undefined,
      createdAt: sql`NOW()` as any,
      updatedAt: sql`NOW()` as any,
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
    if (data.company_name !== undefined) patch.companyName = data.company_name;
    if (data.registration_no !== undefined) patch.registrationNo = data.registration_no ?? undefined;
    if (data.industry !== undefined) patch.industry = data.industry;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.address_json !== undefined) patch.addressJson = data.address_json as any;
    if (data.status !== undefined) patch.status = data.status as any;
    if (data.two_fa_enabled !== undefined) patch.twoFaEnabled = Boolean(data.two_fa_enabled);
    if (data.two_fa_secret !== undefined) patch.twoFaSecret = data.two_fa_secret ?? undefined;
    if (data.notes !== undefined) patch.notes = data.notes ?? undefined;

    await db.update(clients).set(patch).where(eq(clients.id, id));
    return await this.findById(id);
  },

  async list(page = 1, limit = 20, type?: string) {
    const from = (page - 1) * limit;
    
    const cond = type ? eq(clients.clientType, type as any) : undefined;

    const rows = await db
      .select()
      .from(clients)
      .where(cond)
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(from);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(cond);

    return {
      clients: rows.map(rowToClient),
      total: Number(totalRows[0]?.count || 0),
    };
  },
};

import { auditService } from "../audit/audit.service";
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
  website: string | null;
  employees: string | null;
  avatar_url: string | null;
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
    website: row.website ?? null,
    employees: row.employees ?? null,
    avatar_url: row.avatarUrl ?? null,
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
  async create(data: Partial<Client>, actorId?: string, req?: Request) {
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
      website: data.website ?? undefined,
      employees: data.employees ?? undefined,
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
    const client = rowToClient(rows[0]);

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "super_admin",
        action: "client.created",
        entity: client.id,
        clientId: client.id,
        after: client,
        req,
      });
    }

    return client;
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

  async update(id: string, data: any, actorId?: string, req?: Request) {
    const before = await this.findById(id);
    const patch: Partial<typeof clients.$inferInsert> = {};
    
    if (data.company_name !== undefined) patch.companyName = data.company_name;
    if (data.companyName !== undefined) patch.companyName = data.companyName;

    if (data.registration_no !== undefined) patch.registrationNo = data.registration_no || null;
    if (data.registrationNo !== undefined) patch.registrationNo = data.registrationNo || null;

    if (data.industry !== undefined) patch.industry = data.industry;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;

    if (data.address_json !== undefined) patch.addressJson = data.address_json as any;
    if (data.addressJson !== undefined) patch.addressJson = data.addressJson as any;

    if (data.website !== undefined) patch.website = data.website || null;
    if (data.employees !== undefined) patch.employees = data.employees || null;
    if (data.avatar_url !== undefined) patch.avatarUrl = data.avatar_url || null;
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl || null;

    if (data.status !== undefined) patch.status = data.status.toLowerCase() as any;
    if (data.two_fa_enabled !== undefined) patch.twoFaEnabled = Boolean(data.two_fa_enabled);
    if (data.twoFaEnabled !== undefined) patch.twoFaEnabled = Boolean(data.twoFaEnabled);

    if (data.notes !== undefined) patch.notes = data.notes || null;
    if (data.client_type !== undefined) patch.clientType = data.client_type;
    if (data.clientType !== undefined) patch.clientType = data.clientType;

    patch.updatedAt = sql`NOW()` as any;

    await db.update(clients).set(patch).where(eq(clients.id, id));
    const after = await this.findById(id);

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "super_admin", // Usually Super Admin or Admin updates clients
        action: "client.updated",
        entity: id,
        clientId: id,
        before,
        after,
        req,
      });
    }

    return after;
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

  async delete(id: string, actorId?: string, req?: Request) {
    const before = await this.findById(id);
    await db.delete(clients).where(eq(clients.id, id));

    if (actorId) {
      await auditService.log({
        actor: actorId,
        actor_role: "super_admin",
        action: "client.deleted",
        entity: id,
        clientId: id,
        before,
        req,
      });
    }
  },
};

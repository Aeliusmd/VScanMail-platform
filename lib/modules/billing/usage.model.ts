import { db, sql } from "../core/db/mysql";
import { usageEvents } from "../core/db/schema";
import { and, eq } from "drizzle-orm";

export type UsageEvent = {
  id: string;
  client_id: string;
  event_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
};

function rowToUsageEvent(row: typeof usageEvents.$inferSelect): UsageEvent {
  return {
    id: row.id,
    client_id: row.clientId,
    event_type: row.eventType,
    quantity: row.quantity,
    unit_cost: Number(row.unitCost),
    total_cost: Number(row.totalCost),
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const usageEventModel = {
  async create(data: Partial<UsageEvent>) {
    const id = data.id || crypto.randomUUID();
    const toInsert: typeof usageEvents.$inferInsert = {
      id,
      clientId: data.client_id!,
      eventType: data.event_type as any,
      quantity: data.quantity!,
      unitCost: String(data.unit_cost!),
      totalCost: String(data.total_cost!),
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(usageEvents).values(toInsert);
    const rows = await db
      .select()
      .from(usageEvents)
      .where(eq(usageEvents.id, id))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to create usage event");
    return rowToUsageEvent(rows[0]);
  },

  async sumByClient(clientId: string, from?: string, to?: string) {
    const whereParts = [eq(usageEvents.clientId, clientId)];
    if (from) whereParts.push(sql`${usageEvents.createdAt} >= ${new Date(from)}`);
    if (to) whereParts.push(sql`${usageEvents.createdAt} <= ${new Date(to)}`);

    const rows = await db
      .select({
        event_type: usageEvents.eventType,
        quantity: usageEvents.quantity,
        total_cost: usageEvents.totalCost,
      })
      .from(usageEvents)
      .where(and(...whereParts));

    return rows.map((r) => ({
      event_type: r.event_type,
      quantity: r.quantity,
      total_cost: Number(r.total_cost),
    }));
  },
};

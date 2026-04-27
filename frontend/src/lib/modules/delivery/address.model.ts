import { and, desc, eq, isNull } from "drizzle-orm";
import { db, sql } from "../core/db/mysql";
import { deliveryAddresses } from "../core/db/schema";

export type DeliveryAddressRow = typeof deliveryAddresses.$inferSelect;

export type DeliveryAddressListItem = {
  id: string;
  clientId: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

function toListItem(r: DeliveryAddressRow): DeliveryAddressListItem {
  return {
    id: r.id,
    clientId: r.clientId,
    label: r.label,
    recipientName: r.recipientName,
    line1: r.line1,
    line2: r.line2 ?? null,
    city: r.city,
    state: r.state,
    zip: r.zip,
    country: r.country,
    phone: r.phone ?? null,
    email: r.email ?? null,
    isDefault: Boolean(r.isDefault),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

let deliveryAddressesTableReady = false;
async function ensureDeliveryAddressesTable() {
  if (deliveryAddressesTableReady) return;
  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS delivery_addresses (
        id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        label VARCHAR(64) NOT NULL,
        recipient_name VARCHAR(128) NOT NULL,
        line1 VARCHAR(255) NOT NULL,
        line2 VARCHAR(255) NULL,
        city VARCHAR(128) NOT NULL,
        state VARCHAR(32) NOT NULL,
        zip VARCHAR(32) NOT NULL,
        country VARCHAR(2) NOT NULL DEFAULT 'US',
        phone VARCHAR(32) NULL,
        email VARCHAR(255) NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_by VARCHAR(36) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        PRIMARY KEY (id),
        INDEX da_client_idx (client_id),
        INDEX da_client_default_idx (client_id, is_default)
      )
    `)
  );
  deliveryAddressesTableReady = true;
}

export const deliveryAddressModel = {
  async listActiveByClient(clientId: string): Promise<DeliveryAddressListItem[]> {
    await ensureDeliveryAddressesTable();
    const rows = await db
      .select()
      .from(deliveryAddresses)
      .where(and(eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)))
      .orderBy(desc(deliveryAddresses.isDefault), desc(deliveryAddresses.createdAt));
    return rows.map(toListItem);
  },

  async findById(id: string): Promise<DeliveryAddressRow | null> {
    await ensureDeliveryAddressesTable();
    const rows = await db.select().from(deliveryAddresses).where(eq(deliveryAddresses.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findByIdAndClient(id: string, clientId: string): Promise<DeliveryAddressRow | null> {
    await ensureDeliveryAddressesTable();
    const rows = await db
      .select()
      .from(deliveryAddresses)
      .where(and(eq(deliveryAddresses.id, id), eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async createForClient(input: {
    clientId: string;
    createdBy: string;
    label: string;
    recipientName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string | null;
    email?: string | null;
    isDefault?: boolean;
  }): Promise<DeliveryAddressRow> {
    await ensureDeliveryAddressesTable();
    const id = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
      if (input.isDefault) {
        await tx
          .update(deliveryAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(and(eq(deliveryAddresses.clientId, input.clientId), isNull(deliveryAddresses.deletedAt)));
      }

      await tx.insert(deliveryAddresses).values({
        id,
        clientId: input.clientId,
        label: input.label,
        recipientName: input.recipientName,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
        phone: input.phone ?? null,
        email: input.email ?? null,
        isDefault: Boolean(input.isDefault),
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });

    const created = await this.findById(id);
    if (!created) throw new Error("Failed to create delivery address");
    return created;
  },

  async updateForClient(
    clientId: string,
    id: string,
    changes: Partial<{
      label: string;
      recipientName: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string | null;
      email: string | null;
      isDefault: boolean;
    }>
  ): Promise<DeliveryAddressRow> {
    await ensureDeliveryAddressesTable();
    const now = new Date();

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(and(eq(deliveryAddresses.id, id), eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)))
        .limit(1);

      if (!existing[0]) throw new Error("Delivery address not found");

      if (changes.isDefault === true) {
        await tx
          .update(deliveryAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(and(eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)));
      }

      await tx
        .update(deliveryAddresses)
        .set({
          ...(changes.label !== undefined ? { label: changes.label } : {}),
          ...(changes.recipientName !== undefined ? { recipientName: changes.recipientName } : {}),
          ...(changes.line1 !== undefined ? { line1: changes.line1 } : {}),
          ...(changes.line2 !== undefined ? { line2: changes.line2 } : {}),
          ...(changes.city !== undefined ? { city: changes.city } : {}),
          ...(changes.state !== undefined ? { state: changes.state } : {}),
          ...(changes.zip !== undefined ? { zip: changes.zip } : {}),
          ...(changes.country !== undefined ? { country: changes.country } : {}),
          ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
          ...(changes.email !== undefined ? { email: changes.email } : {}),
          ...(changes.isDefault !== undefined ? { isDefault: changes.isDefault } : {}),
          updatedAt: now,
        })
        .where(eq(deliveryAddresses.id, id));
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Delivery address not found");
    return updated;
  },

  async softDelete(clientId: string, id: string): Promise<void> {
    await ensureDeliveryAddressesTable();
    const now = new Date();
    await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(deliveryAddresses)
        .where(and(eq(deliveryAddresses.id, id), eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)))
        .limit(1);

      const existing = rows[0];
      if (!existing) throw new Error("Delivery address not found");

      await tx
        .update(deliveryAddresses)
        .set({ deletedAt: now, isDefault: false, updatedAt: now })
        .where(eq(deliveryAddresses.id, id));

      if (existing.isDefault) {
        const fallback = await tx
          .select({ id: deliveryAddresses.id })
          .from(deliveryAddresses)
          .where(and(eq(deliveryAddresses.clientId, clientId), isNull(deliveryAddresses.deletedAt)))
          .orderBy(desc(deliveryAddresses.createdAt))
          .limit(1);

        if (fallback[0]) {
          await tx.update(deliveryAddresses).set({ isDefault: true, updatedAt: now }).where(eq(deliveryAddresses.id, fallback[0].id));
        }
      }
    });
  },
};

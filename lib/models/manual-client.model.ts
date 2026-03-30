import { db, sql } from "@/lib/db/mysql";
import { companyDirectory, manuallyAddedClients } from "@/lib/db/schema";
import { companyDirectoryModel } from "./company-directory.model";
import { eq, desc } from "drizzle-orm";
import type { AddManualCompanyInput, UpdateSubscriptionInput } from "@/lib/validators/company.schema";

export type ManualClientRecord = {
  // manually_added_clients fields
  id: string;
  directoryId: string;
  addedBy: string;
  contactPerson: string | null;
  website: string | null;
  addressText: string | null;
  notes: string | null;
  paymentType: string;
  subscriptionPlan: string;
  subscriptionAmount: number;
  subscriptionStatus: string;
  linkedClientId: string | null;
  addedAt: string;
  // company_directory fields (joined)
  companyName: string;
  email: string;
  industry: string;
  phone: string;
  status: string;
  createdAt: string;
};

export const manualClientModel = {
  /**
   * Create a new manually-added company.
   * Inserts into BOTH company_directory AND manually_added_clients in a transaction.
   */
  async create(
    adminUserId: string,
    data: AddManualCompanyInput
  ): Promise<ManualClientRecord> {
    const directoryId = crypto.randomUUID();
    const macId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1. Insert into company_directory
      await tx.insert(companyDirectory).values({
        id: directoryId,
        sourceType: "manual",
        sourceId: macId,
        companyName: data.companyName,
        email: data.email,
        industry: data.industry,
        phone: data.phone || "",
        status: data.status === "active" ? "active" : "pending",
        createdAt: sql`NOW()` as any,
      });

      // 2. Insert into manually_added_clients
      await tx.insert(manuallyAddedClients).values({
        id: macId,
        directoryId,
        addedBy: adminUserId,
        contactPerson: data.contactPerson || null,
        website: data.website || null,
        addressText: data.address || null,
        notes: data.notes || null,
        paymentType: data.paymentType ?? "other",
        subscriptionPlan: "none",
        subscriptionAmount: "0",
        subscriptionStatus: "pending",
        linkedClientId: null,
        addedAt: sql`NOW()` as any,
      });
    });

    // Return the combined record
    return this.findById(macId);
  },

  async findById(id: string): Promise<ManualClientRecord> {
    const rows = await db
      .select()
      .from(manuallyAddedClients)
      .innerJoin(
        companyDirectory,
        eq(manuallyAddedClients.directoryId, companyDirectory.id)
      )
      .where(eq(manuallyAddedClients.id, id))
      .limit(1);

    if (!rows[0]) throw new Error("Manual client not found");
    return this._rowToRecord(rows[0]);
  },

  async list(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(manuallyAddedClients)
      .innerJoin(
        companyDirectory,
        eq(manuallyAddedClients.directoryId, companyDirectory.id)
      )
      .orderBy(desc(companyDirectory.createdAt))
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(manuallyAddedClients);

    return {
      companies: rows.map((r) => this._rowToRecord(r)),
      total: Number(totalRows[0]?.count || 0),
    };
  },

  /**
   * Update subscription fields and auto-sync company_directory.status
   */
  async updateSubscription(
    macId: string,
    data: UpdateSubscriptionInput
  ): Promise<ManualClientRecord> {
    // Map subscription status → directory status
    const directoryStatus =
      data.subscriptionStatus === "active"
        ? "active"
        : data.subscriptionStatus === "suspended"
        ? "suspended"
        : "pending";

    const mac = await this.findById(macId);

    await db.transaction(async (tx) => {
      await tx
        .update(manuallyAddedClients)
        .set({
          subscriptionPlan: data.subscriptionPlan,
          subscriptionAmount: String(data.subscriptionAmount),
          subscriptionStatus: data.subscriptionStatus,
        })
        .where(eq(manuallyAddedClients.id, macId));

      await tx
        .update(companyDirectory)
        .set({ status: directoryStatus })
        .where(eq(companyDirectory.id, mac.directoryId));
    });

    return this.findById(macId);
  },

  _rowToRecord(row: any): ManualClientRecord {
    const mac = row.manually_added_clients;
    const cd = row.company_directory;
    return {
      id: mac.id,
      directoryId: mac.directoryId,
      addedBy: mac.addedBy,
      contactPerson: mac.contactPerson ?? null,
      website: mac.website ?? null,
      addressText: mac.addressText ?? null,
      notes: mac.notes ?? null,
      paymentType: mac.paymentType,
      subscriptionPlan: mac.subscriptionPlan,
      subscriptionAmount: Number(mac.subscriptionAmount ?? 0),
      subscriptionStatus: mac.subscriptionStatus,
      linkedClientId: mac.linkedClientId ?? null,
      addedAt: new Date(mac.addedAt as any).toISOString(),
      // from company_directory join
      companyName: cd.companyName,
      email: cd.email,
      industry: cd.industry,
      phone: cd.phone,
      status: cd.status,
      createdAt: new Date(cd.createdAt as any).toISOString(),
    };
  },
};

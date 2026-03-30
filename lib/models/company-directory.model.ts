import { db, sql } from "@/lib/db/mysql";
import { companyDirectory } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type DirectoryEntry = {
  id: string;
  sourceType: "client" | "manual";
  sourceId: string;
  companyName: string;
  email: string;
  industry: string;
  phone: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
};

function rowToEntry(row: typeof companyDirectory.$inferSelect): DirectoryEntry {
  return {
    id: row.id,
    sourceType: row.sourceType as "client" | "manual",
    sourceId: row.sourceId,
    companyName: row.companyName,
    email: row.email,
    industry: row.industry,
    phone: row.phone,
    status: row.status as "active" | "pending" | "suspended",
    createdAt: new Date(row.createdAt as any).toISOString(),
  };
}

export const companyDirectoryModel = {
  async create(data: {
    id: string;
    sourceType: "client" | "manual";
    sourceId: string;
    companyName: string;
    email: string;
    industry: string;
    phone: string;
    status: "active" | "pending" | "suspended";
  }) {
    await db.insert(companyDirectory).values({
      ...data,
      createdAt: sql`NOW()` as any,
    });
    const rows = await db
      .select()
      .from(companyDirectory)
      .where(eq(companyDirectory.id, data.id))
      .limit(1);
    if (!rows[0]) throw new Error("Failed to create directory entry");
    return rowToEntry(rows[0]);
  },

  async updateStatus(id: string, status: "active" | "pending" | "suspended") {
    await db
      .update(companyDirectory)
      .set({ status })
      .where(eq(companyDirectory.id, id));
  },

  async list(page = 1, limit = 100) {
    const offset = (page - 1) * limit;
    const rows = await db
      .select()
      .from(companyDirectory)
      .orderBy(desc(companyDirectory.createdAt))
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(companyDirectory);

    return {
      companies: rows.map(rowToEntry),
      total: Number(totalRows[0]?.count || 0),
    };
  },

  async findByEmail(email: string) {
    const rows = await db
      .select()
      .from(companyDirectory)
      .where(eq(companyDirectory.email, email))
      .limit(1);
    return rows[0] ? rowToEntry(rows[0]) : null;
  },
};

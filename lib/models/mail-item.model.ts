import { db, sql } from "@/lib/db/mysql";
import { mailItems } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type MailItem = {
  id: string;
  client_id: string;
  irn: string;
  type: "letter" | "cheque" | "package" | "legal";
  envelope_front_url: string;
  envelope_back_url: string;
  content_scan_urls: string[];
  tamper_detected: boolean;
  tamper_annotations: any;
  ocr_text: string | null;
  ai_summary: string | null;
  ai_actions: { action: string; deadline: string; priority: string }[] | null;
  ai_risk_level: "low" | "medium" | "high" | "critical" | null;
  retention_until: string;
  scanned_by: string;
  scanned_at: string;
  status: "received" | "scanned" | "processed" | "delivered";
  created_at: string;
};

function rowToMailItem(row: typeof mailItems.$inferSelect): MailItem {
  return {
    id: row.id,
    client_id: row.clientId,
    irn: row.irn,
    type: row.type as any,
    envelope_front_url: row.envelopeFrontUrl,
    envelope_back_url: row.envelopeBackUrl,
    content_scan_urls: (row.contentScanUrls as any) ?? [],
    tamper_detected: Boolean(row.tamperDetected),
    tamper_annotations: row.tamperAnnotations ?? null,
    ocr_text: row.ocrText ?? null,
    ai_summary: row.aiSummary ?? null,
    ai_actions: (row.aiActions as any) ?? null,
    ai_risk_level: (row.aiRiskLevel as any) ?? null,
    retention_until: (row.retentionUntil as Date).toISOString(),
    scanned_by: row.scannedBy,
    scanned_at: (row.scannedAt as Date).toISOString(),
    status: row.status as any,
    created_at: (row.createdAt as Date).toISOString(),
  };
}

export const mailItemModel = {
  async create(data: Partial<MailItem>) {
    const toInsert: typeof mailItems.$inferInsert = {
      id: data.id!,
      clientId: data.client_id!,
      irn: data.irn!,
      type: data.type as any,
      envelopeFrontUrl: data.envelope_front_url!,
      envelopeBackUrl: data.envelope_back_url!,
      contentScanUrls: (data.content_scan_urls ?? []) as any,
      tamperDetected: Boolean(data.tamper_detected ?? false),
      tamperAnnotations: data.tamper_annotations ?? undefined,
      ocrText: data.ocr_text ?? undefined,
      aiSummary: data.ai_summary ?? undefined,
      aiActions: data.ai_actions ?? undefined,
      aiRiskLevel: (data.ai_risk_level as any) ?? undefined,
      retentionUntil: new Date(data.retention_until!),
      scannedBy: data.scanned_by!,
      scannedAt: new Date(data.scanned_at!),
      status: (data.status as any) ?? "received",
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
    await db.insert(mailItems).values(toInsert);
    const rows = await db.select().from(mailItems).where(eq(mailItems.id, toInsert.id)).limit(1);
    if (!rows[0]) throw new Error("Failed to create mail item");
    return rowToMailItem(rows[0]);
  },

  async findById(id: string) {
    const rows = await db.select().from(mailItems).where(eq(mailItems.id, id)).limit(1);
    if (!rows[0]) throw new Error("Mail item not found");
    return rowToMailItem(rows[0]);
  },

  async listByClient(
    clientId: string,
    opts: { page?: number; limit?: number; type?: string; status?: string } = {}
  ) {
    const { page = 1, limit = 20, type, status } = opts;
    const from = (page - 1) * limit;

    const whereParts: any[] = [eq(mailItems.clientId, clientId)];
    if (type) whereParts.push(eq(mailItems.type, type as any));
    if (status) whereParts.push(eq(mailItems.status, status as any));

    const rows = await db
      .select()
      .from(mailItems)
      .where(and(...whereParts))
      .orderBy(desc(mailItems.scannedAt))
      .limit(limit)
      .offset(from);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(mailItems)
      .where(and(...whereParts));

    return {
      items: rows.map(rowToMailItem),
      total: Number(totalRows[0]?.count || 0),
    };
  },

  async update(id: string, data: Partial<MailItem>) {
    const patch: Partial<typeof mailItems.$inferInsert> = {};
    if (data.irn !== undefined) patch.irn = data.irn;
    if (data.type !== undefined) patch.type = data.type as any;
    if (data.envelope_front_url !== undefined) patch.envelopeFrontUrl = data.envelope_front_url;
    if (data.envelope_back_url !== undefined) patch.envelopeBackUrl = data.envelope_back_url;
    if (data.content_scan_urls !== undefined) patch.contentScanUrls = data.content_scan_urls as any;
    if (data.tamper_detected !== undefined) patch.tamperDetected = Boolean(data.tamper_detected);
    if (data.tamper_annotations !== undefined) patch.tamperAnnotations = data.tamper_annotations ?? undefined;
    if (data.ocr_text !== undefined) patch.ocrText = data.ocr_text ?? undefined;
    if (data.ai_summary !== undefined) patch.aiSummary = data.ai_summary ?? undefined;
    if (data.ai_actions !== undefined) patch.aiActions = data.ai_actions ?? undefined;
    if (data.ai_risk_level !== undefined) patch.aiRiskLevel = (data.ai_risk_level as any) ?? undefined;
    if (data.retention_until !== undefined) patch.retentionUntil = new Date(data.retention_until);
    if (data.scanned_by !== undefined) patch.scannedBy = data.scanned_by;
    if (data.scanned_at !== undefined) patch.scannedAt = new Date(data.scanned_at);
    if (data.status !== undefined) patch.status = data.status as any;

    await db.update(mailItems).set(patch).where(eq(mailItems.id, id));
    return await this.findById(id);
  },

  async getDestructionDue(beforeDate: string) {
    const rows = await db
      .select()
      .from(mailItems)
      .where(
        and(
          eq(mailItems.status, "delivered"),
          sql`${mailItems.retentionUntil} <= ${new Date(beforeDate)}`
        )
      );
    return rows.map(rowToMailItem);
  },
};

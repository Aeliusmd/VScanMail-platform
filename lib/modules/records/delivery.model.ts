import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients } from "@/lib/modules/core/db/schema";
import { ensureClientTableDeliveryColumns } from "@/lib/modules/core/db/dynamic-table";

export type DeliveryStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type DeliverySourceType = "cheque" | "mail";

export type DeliveryRow = {
  id: string;
  sourceType: DeliverySourceType;
  irn: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  amountFigures: number | null;
  chequeStatus: string | null;
  requestedAt: string | null;
  requestedBy: string | null;
  status: DeliveryStatus | null;
  preferredDate: string | null;
  notes: string | null;
  addressId: string | null;
  addressName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  addressCountry: string | null;
  addressPhone: string | null;
  addressEmail: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
  inTransitAt: string | null;
  markedDeliveredBy: string | null;
  markedDeliveredAt: string | null;
  vSendDocsSubmissionId: string | null;
  vSendDocsSubmissionNumber: string | null;
  trackingNumber: string | null;
  proofOfServiceUrl: string | null;
};

async function locateRecordById(id: string) {
  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  if (!allClients.length) return null;

  const queries = allClients.map(
    (c) =>
      sql`SELECT *, ${c.id} AS _client_id, ${c.tableName} AS _table_name
          FROM ${sql.raw(`\`${c.tableName}\``)}
          WHERE id = ${id} AND record_type IN ('cheque','letter','package','legal')`
  );
  const unionQuery = sql.join(queries, sql` UNION ALL `);
  const [rows] = (await db.execute(unionQuery)) as any;
  return rows[0] || null;
}

function toIso(v: any): string | null {
  return v ? new Date(v).toISOString() : null;
}

function mapRow(r: any): DeliveryRow {
  const sourceType: DeliverySourceType = r.record_type === "cheque" ? "cheque" : "mail";
  return {
    id: String(r.id),
    sourceType,
    irn: String(r.irn || ""),
    clientId: String(r.clientId || r._client_id),
    clientName: r.clientName ?? undefined,
    clientEmail: r.clientEmail ?? undefined,
    amountFigures: sourceType === "cheque" ? Number(r.cheque_amount_figures || 0) : null,
    chequeStatus: r.cheque_status ?? null,
    requestedAt: toIso(r.delivery_requested_at),
    requestedBy: r.delivery_requested_by ?? null,
    status: (r.delivery_status as DeliveryStatus | null) ?? null,
    preferredDate: toIso(r.delivery_preferred_date),
    notes: r.delivery_notes ?? null,
    addressId: r.delivery_address_id ?? null,
    addressName: r.delivery_address_name ?? null,
    addressLine1: r.delivery_address_line1 ?? null,
    addressLine2: r.delivery_address_line2 ?? null,
    addressCity: r.delivery_address_city ?? null,
    addressState: r.delivery_address_state ?? null,
    addressZip: r.delivery_address_zip ?? null,
    addressCountry: r.delivery_address_country ?? null,
    addressPhone: r.delivery_address_phone ?? null,
    addressEmail: r.delivery_address_email ?? null,
    decidedBy: r.delivery_decided_by ?? null,
    decidedAt: toIso(r.delivery_decided_at),
    rejectReason: r.delivery_reject_reason ?? null,
    inTransitAt: toIso(r.delivery_in_transit_at),
    markedDeliveredBy: r.delivery_marked_delivered_by ?? null,
    markedDeliveredAt: toIso(r.delivery_marked_delivered_at),
    vSendDocsSubmissionId: r.delivery_vsendocs_submission_id ?? null,
    vSendDocsSubmissionNumber: r.delivery_vsendocs_submission_number ?? null,
    trackingNumber: r.delivery_tracking_number ?? null,
    proofOfServiceUrl: r.delivery_proof_of_service_url ?? null,
  };
}

export const deliveryModel = {
  async findRecordRowById(id: string) {
    return locateRecordById(id);
  },

  async listForClient(clientId: string, opts?: { limit?: number }) {
    const limit = opts?.limit ?? 200;
    const [clientRow] = await db
      .select({ tableName: clients.tableName })
      .from(clients)
      .where(sql`id = ${clientId}`)
      .limit(1);

    if (!clientRow?.tableName) return { deliveries: [] as DeliveryRow[] };
    const tableName = clientRow.tableName;

    const [rows] = (await db.execute(
      sql.raw(
        `SELECT *
         FROM \`${tableName}\`
         WHERE record_type IN ('cheque','letter','package','legal')
           AND delivery_requested_at IS NOT NULL
         ORDER BY delivery_requested_at DESC
         LIMIT ${Number(limit)}`
      )
    )) as any;

    return { deliveries: (rows as any[]).map((r) => mapRow({ ...r, clientId })) };
  },

  async listAllForAdmin(opts?: { limit?: number }) {
    const limit = opts?.limit ?? 500;

    const allClientsRaw = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
    if (!allClientsRaw.length) return { deliveries: [] as DeliveryRow[] };

    const [tablesResult] = await db.execute(sql`SHOW TABLES`);
    const existingTableNames = new Set(((tablesResult as unknown) as any[]).map((row) => Object.values(row)[0] as string));
    const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
    if (!allClients.length) return { deliveries: [] as DeliveryRow[] };

    // Ensure all tables share the same delivery_* columns before UNION ALL (MySQL requires identical column sets).
    await Promise.all(allClients.map((c) => ensureClientTableDeliveryColumns(c.tableName)));

    const unionParts = allClients.map(
      (c) =>
        `SELECT *, '${c.id}' AS clientId
         FROM \`${c.tableName}\`
         WHERE record_type IN ('cheque','letter','package','legal')
           AND delivery_requested_at IS NOT NULL`
    );
    const unionSql = unionParts.join(" UNION ALL ");

    const [rows] = (await db.execute(
      sql.raw(
        `SELECT q.*, cl.company_name AS clientName, cl.email AS clientEmail
         FROM (${unionSql}) q
         INNER JOIN \`clients\` cl ON q.clientId = cl.id
         ORDER BY q.delivery_requested_at DESC
         LIMIT ${Number(limit)}`
      )
    )) as any;

    return { deliveries: (rows as any[]).map((r) => mapRow(r)) };
  },
};

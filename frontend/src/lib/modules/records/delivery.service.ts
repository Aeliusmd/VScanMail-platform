import { and, eq, inArray } from "drizzle-orm";
import { auditService } from "@/lib/modules/audit/audit.service";
import { clientModel } from "@/lib/modules/clients/client.model";
import { ensureClientTableDeliveryColumns, getClientTableName } from "@/lib/modules/core/db/dynamic-table";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { deliveryAddressModel } from "@/lib/modules/delivery/address.model";
import { isUspsMailingAddress } from "@/lib/modules/delivery/address.schema";
import { notificationService } from "@/lib/modules/notifications/notification.service";
import { deliveryModel, type DeliveryStatus } from "./delivery.model";

function escapeIdent(ident: string) {
  return `\`${String(ident).replace(/`/g, "``")}\``;
}

function escapeSql(value: string | null | undefined): string {
  return String(value ?? "").replace(/'/g, "''");
}

type ResolvedAdmin = {
  userId: string;
  email: string;
};

type ResolvedClientUser = {
  userId: string;
  orgEmail: string;
  userEmail: string | null;
};

async function resolveAssignedAdmin(clientId: string): Promise<ResolvedAdmin | null> {
  const clientRows = await db
    .select({ addedBy: clients.addedBy })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  const addedBy = clientRows[0]?.addedBy ?? null;
  if (addedBy) {
    const assignedRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, addedBy))
      .limit(1);
    if (assignedRows[0]) return { userId: assignedRows[0].id, email: assignedRows[0].email };
  }

  const fallbackRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.isActive, true), inArray(profiles.role, ["admin", "super_admin"])))
    .limit(1);

  if (!fallbackRows[0]) return null;
  return { userId: fallbackRows[0].id, email: fallbackRows[0].email };
}

async function resolveClientUser(clientId: string): Promise<ResolvedClientUser | null> {
  const rows = await db
    .select({ userId: profiles.userId, orgEmail: clients.email, userEmail: users.email })
    .from(profiles)
    .innerJoin(clients, eq(clients.id, profiles.clientId))
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.clientId, clientId), eq(profiles.role, "client")))
    .limit(1);

  const r = rows[0];
  if (!r?.userId || !r?.orgEmail) return null;
  return { userId: r.userId, orgEmail: r.orgEmail, userEmail: r.userEmail ?? null };
}

function uniqueRecipientEmails(orgEmail: string, userEmail: string | null): string[] {
  const out: string[] = [];
  const a = String(orgEmail || "").trim();
  if (a) out.push(a);
  const b = String(userEmail || "").trim();
  if (b && b.toLowerCase() !== a.toLowerCase()) out.push(b);
  return out;
}

function isActiveStatus(status: DeliveryStatus | null | undefined): boolean {
  return status === "pending" || status === "approved" || status === "in_transit";
}

function isAllowedProofUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : null;
    const s3Public = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL) : null;
    return Boolean(
      (appUrl && url.host === appUrl.host) ||
        (s3Public && url.host === s3Public.host)
    );
  } catch {
    return false;
  }
}

export const deliveryService = {
  async requestDelivery(params: {
    recordId: string;
    addressId: string;
    preferredDate?: string;
    notes?: string;
    actorId: string;
    actorRole: "client";
    clientId: string;
    req?: Request;
  }) {
    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");
    if (String(recordRow._client_id) !== params.clientId) throw new Error("Record does not belong to client");

    const currentDeliveryStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (isActiveStatus(currentDeliveryStatus)) throw new Error("Delivery already requested");

    const sourceType = recordRow.record_type === "cheque" ? "cheque" : "mail";

    const address = await deliveryAddressModel.findByIdAndClient(params.addressId, params.clientId);
    if (!address) throw new Error("Delivery address not found");

    if (
      !isUspsMailingAddress({
        country: address.country,
        state: address.state,
        zip: address.zip,
      })
    ) {
      throw new Error(
        "Selected delivery address is not USPS-compatible for vSendDocs. Use a US address with a 2-letter state code and 5-digit or ZIP+4 ZIP. Update it under Account → Delivery addresses."
      );
    }

    const tableName = String(recordRow._table_name || (await getClientTableName(params.clientId)));
    await ensureClientTableDeliveryColumns(tableName);
    const now = new Date();
    const preferredDateSql =
      params.preferredDate && !Number.isNaN(new Date(params.preferredDate).getTime())
        ? `'${new Date(params.preferredDate).toISOString().slice(0, 19).replace("T", " ")}'`
        : "NULL";

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = 'pending',
             delivery_requested_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             delivery_requested_by = '${escapeSql(params.actorId)}',
             delivery_address_id = '${escapeSql(address.id)}',
             delivery_address_name = '${escapeSql(address.recipientName)}',
             delivery_address_line1 = '${escapeSql(address.line1)}',
             delivery_address_line2 = ${address.line2 ? `'${escapeSql(address.line2)}'` : "NULL"},
             delivery_address_city = '${escapeSql(address.city)}',
             delivery_address_state = '${escapeSql(address.state)}',
             delivery_address_zip = '${escapeSql(address.zip)}',
             delivery_address_country = '${escapeSql(address.country)}',
             delivery_address_phone = ${address.phone ? `'${escapeSql(address.phone)}'` : "NULL"},
             delivery_address_email = ${address.email ? `'${escapeSql(address.email)}'` : "NULL"},
             delivery_notes = ${params.notes ? `'${escapeSql(params.notes)}'` : "NULL"},
             delivery_preferred_date = ${preferredDateSql},
             delivery_decided_by = NULL,
             delivery_decided_at = NULL,
             delivery_reject_reason = NULL,
             delivery_in_transit_at = NULL,
             delivery_marked_delivered_by = NULL,
             delivery_marked_delivered_at = NULL,
             delivery_vsendocs_submission_id = NULL,
             delivery_vsendocs_submission_number = NULL,
             delivery_tracking_number = NULL,
             delivery_proof_of_service_url = NULL
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    const client = await clientModel.findById(params.clientId);
    const assignedAdmin = await resolveAssignedAdmin(params.clientId);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery.requested",
      entity: params.recordId,
      clientId: params.clientId,
      after: { recordId: params.recordId, sourceType, addressId: address.id },
      req: params.req,
      notifRecipientId: assignedAdmin?.userId,
      notifTitle: assignedAdmin ? `New Delivery Request — ${client.company_name}` : undefined,
      notifTargetUrl: assignedAdmin ? `/admin/deliveries?highlight=${params.recordId}` : undefined,
    });

    if (assignedAdmin) {
      notificationService
        .sendDeliveryRequestEmailToAdmin({
          adminEmail: assignedAdmin.email,
          companyName: client.company_name,
          requestId: params.recordId,
          sourceType,
          irn: String(recordRow.irn || ""),
          recipientName: address.recipientName,
        })
        .catch((err) => console.error("[delivery] request email failed:", err));
    }

    return { ok: true };
  },

  async cancelRequest(params: {
    recordId: string;
    actorId: string;
    actorRole: "client";
    clientId: string;
    req?: Request;
  }) {
    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");
    if (String(recordRow._client_id) !== params.clientId) throw new Error("Not authorised");

    const currentStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (currentStatus !== "pending") throw new Error("No active pending delivery to cancel");

    const tableName = String(recordRow._table_name || (await getClientTableName(params.clientId)));
    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = 'cancelled',
             delivery_decided_by = NULL,
             delivery_decided_at = NULL,
             delivery_reject_reason = NULL
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    const client = await clientModel.findById(params.clientId);
    const assignedAdmin = await resolveAssignedAdmin(params.clientId);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery.cancelled",
      entity: params.recordId,
      clientId: params.clientId,
      req: params.req,
      notifRecipientId: assignedAdmin?.userId,
      notifTitle: assignedAdmin ? `Delivery cancelled — ${client.company_name}` : undefined,
      notifTargetUrl: assignedAdmin ? `/admin/deliveries?highlight=${params.recordId}` : undefined,
    });

    if (assignedAdmin) {
      notificationService
        .sendDeliveryCancelledEmailToAdmin({
          adminEmail: assignedAdmin.email,
          companyName: client.company_name,
          requestId: params.recordId,
          sourceType: recordRow.record_type === "cheque" ? "cheque" : "mail",
          irn: String(recordRow.irn || ""),
        })
        .catch((err) => console.error("[delivery] cancel email failed:", err));
    }

    return { ok: true };
  },

  async listMine(params: { clientId: string; limit?: number }) {
    return deliveryModel.listForClient(params.clientId, { limit: params.limit });
  },

  async adminList(params?: { limit?: number }) {
    return deliveryModel.listAllForAdmin({ limit: params?.limit });
  },

  async adminApprove(params: {
    recordId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    req?: Request;
  }) {
    return this.adminDecide({ ...params, decision: "approved" });
  },

  async adminReject(params: {
    recordId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    reason: string;
    req?: Request;
  }) {
    return this.adminDecide({ ...params, decision: "rejected", reason: params.reason });
  },

  async adminDecide(params: {
    recordId: string;
    decision: "approved" | "rejected";
    actorId: string;
    actorRole: "admin" | "super_admin";
    reason?: string;
    req?: Request;
  }) {
    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");
    const currentStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (currentStatus !== "pending") throw new Error("Request is not pending");

    if (params.decision === "rejected" && !String(params.reason || "").trim()) {
      throw new Error("Reject reason is required");
    }

    const clientId = String(recordRow._client_id);
    const tableName = String(recordRow._table_name || (await getClientTableName(clientId)));
    const now = new Date();

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = '${params.decision}',
             delivery_decided_by = '${escapeSql(params.actorId)}',
             delivery_decided_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             delivery_reject_reason = ${params.decision === "rejected" ? `'${escapeSql(params.reason)}'` : "NULL"}
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: `delivery.${params.decision}`,
      entity: params.recordId,
      clientId,
      req: params.req,
    });

    const clientUser = await resolveClientUser(clientId);
    if (clientUser) {
      const sourceType = recordRow.record_type === "cheque" ? "cheque" : "mail";
      const irn = String(recordRow.irn || "");
      const recipients = uniqueRecipientEmails(clientUser.orgEmail, clientUser.userEmail);

      await auditService.log({
        actor: params.actorId,
        actor_role: params.actorRole,
        action: `delivery.${params.decision}`,
        entity: params.recordId,
        clientId,
        after: { recordId: params.recordId, decision: params.decision },
        req: params.req,
        notifRecipientId: clientUser.userId,
        notifTitle: params.decision === "approved" ? "Delivery approved" : "Delivery rejected",
        notifTargetUrl: `/customer/${clientId}/deliveries`,
      });

      for (const toEmail of recipients) {
        if (params.decision === "approved") {
          notificationService
            .sendDeliveryApprovedEmailToClient({ clientId, toEmail, requestId: params.recordId, sourceType, irn })
            .catch((err) => console.error("[delivery] approved email failed:", err));
        } else {
          notificationService
            .sendDeliveryRejectedEmailToClient({
              clientId,
              toEmail,
              requestId: params.recordId,
              sourceType,
              irn,
              reason: String(params.reason || ""),
            })
            .catch((err) => console.error("[delivery] rejected email failed:", err));
        }
      }
    }

    return { ok: true };
  },

  async adminMarkInTransit(params: {
    recordId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    submissionId?: string;
    submissionNumber?: string;
    trackingNumber: string;
    req?: Request;
  }) {
    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");
    const currentStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (currentStatus !== "approved") throw new Error("Request must be approved first");

    const clientId = String(recordRow._client_id);
    const tableName = String(recordRow._table_name || (await getClientTableName(clientId)));
    const now = new Date();

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = 'in_transit',
             delivery_in_transit_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             delivery_vsendocs_submission_id = ${params.submissionId ? `'${escapeSql(params.submissionId)}'` : "NULL"},
             delivery_vsendocs_submission_number = ${params.submissionNumber ? `'${escapeSql(params.submissionNumber)}'` : "NULL"},
             delivery_tracking_number = '${escapeSql(params.trackingNumber)}'
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery.in_transit",
      entity: params.recordId,
      clientId,
      req: params.req,
    });

    {
      const clientUser = await resolveClientUser(clientId);
      if (clientUser) {
        const sourceType = recordRow.record_type === "cheque" ? "cheque" : "mail";
        const irn = String(recordRow.irn || "");
        const recipients = uniqueRecipientEmails(clientUser.orgEmail, clientUser.userEmail);

        await auditService.log({
          actor: params.actorId,
          actor_role: params.actorRole,
          action: "delivery.in_transit",
          entity: params.recordId,
          clientId,
          after: { recordId: params.recordId, trackingNumber: params.trackingNumber },
          req: params.req,
          notifRecipientId: clientUser.userId,
          notifTitle: "Your delivery is on its way",
          notifTargetUrl: `/customer/${clientId}/deliveries`,
        });

        for (const toEmail of recipients) {
          notificationService
            .sendDeliveryInTransitEmailToClient({
              clientId,
              toEmail,
              requestId: params.recordId,
              sourceType,
              irn,
              trackingNumber: params.trackingNumber,
            })
            .catch((err) => console.error("[delivery] in-transit email failed:", err));
        }
      }
    }

    return { ok: true };
  },

  async adminCancel(params: {
    recordId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    req?: Request;
  }) {
    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");

    const currentStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (currentStatus === "cancelled" || currentStatus === "delivered") {
      throw new Error(`Cannot cancel a delivery that is already ${currentStatus}`);
    }

    const clientId = String(recordRow._client_id);
    const tableName = String(recordRow._table_name || (await getClientTableName(clientId)));
    const now = new Date();

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = 'cancelled',
             delivery_decided_by = '${escapeSql(params.actorId)}',
             delivery_decided_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             delivery_reject_reason = NULL
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole as any,
      action: "delivery.cancelled",
      entity: params.recordId,
      clientId,
      req: params.req,
    });

    return { ok: true };
  },

  async adminMarkDelivered(params: {
    recordId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    proofOfServiceUrl: string;
    req?: Request;
  }) {
    if (!isAllowedProofUrl(params.proofOfServiceUrl)) {
      throw new Error("Proof-of-service URL must be hosted on an allowed domain");
    }

    const recordRow = await deliveryModel.findRecordRowById(params.recordId);
    if (!recordRow) throw new Error("Record not found");
    const currentStatus = (recordRow.delivery_status as DeliveryStatus | null) ?? null;
    if (!["approved", "in_transit"].includes(String(currentStatus))) {
      throw new Error("Request must be approved or in transit");
    }

    const clientId = String(recordRow._client_id);
    const tableName = String(recordRow._table_name || (await getClientTableName(clientId)));
    const now = new Date();

    const chequeStatusSet =
      recordRow.record_type === "cheque" ? ", cheque_status = 'cleared'" : "";

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_status = 'delivered',
             delivery_marked_delivered_by = '${escapeSql(params.actorId)}',
             delivery_marked_delivered_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             delivery_proof_of_service_url = '${escapeSql(params.proofOfServiceUrl)}'
             ${chequeStatusSet}
         WHERE id = '${escapeSql(params.recordId)}'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery.delivered",
      entity: params.recordId,
      clientId,
      req: params.req,
    });

    {
      const clientUser = await resolveClientUser(clientId);
      if (clientUser) {
        const sourceType = recordRow.record_type === "cheque" ? "cheque" : "mail";
        const irn = String(recordRow.irn || "");
        const recipients = uniqueRecipientEmails(clientUser.orgEmail, clientUser.userEmail);

        await auditService.log({
          actor: params.actorId,
          actor_role: params.actorRole,
          action: "delivery.delivered",
          entity: params.recordId,
          clientId,
          after: { recordId: params.recordId, proofOfServiceUrl: params.proofOfServiceUrl },
          req: params.req,
          notifRecipientId: clientUser.userId,
          notifTitle: "Delivery completed",
          notifTargetUrl: `/customer/${clientId}/deliveries`,
        });

        for (const toEmail of recipients) {
          notificationService
            .sendDeliveryDeliveredEmailToClient({
              clientId,
              toEmail,
              requestId: params.recordId,
              sourceType,
              irn,
              proofOfServiceUrl: params.proofOfServiceUrl,
            })
            .catch((err) => console.error("[delivery] delivered email failed:", err));
        }
      }
    }

    return { ok: true };
  },
};

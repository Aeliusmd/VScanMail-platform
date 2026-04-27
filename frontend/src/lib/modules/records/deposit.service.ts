import { auditService } from "@/lib/modules/audit/audit.service";
import { aiService } from "@/lib/modules/ai/ai.service";
import { bankAccountModel } from "@/lib/modules/banking/bank-account.model";
import { clientModel } from "@/lib/modules/clients/client.model";
import { hmacSha256Hex } from "@/lib/modules/core/crypto/field-encryption";
import { ensureClientTableDepositColumns, getClientTableName } from "@/lib/modules/core/db/dynamic-table";
import { clients, profiles, users } from "@/lib/modules/core/db/schema";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { notificationService } from "@/lib/modules/notifications/notification.service";
import { storageService } from "@/lib/modules/storage/storage.service";
import { and, eq, inArray } from "drizzle-orm";
import { depositModel, type DepositDecision } from "./deposit.model";
import crypto from "crypto";

function escapeIdent(ident: string) {
  return `\`${String(ident).replace(/`/g, "``")}\``;
}

function parseYyyyMmDd(s: string): Date | null {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
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
    if (assignedRows[0]) {
      return { userId: assignedRows[0].id, email: assignedRows[0].email };
    }
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

function tryParseJsonLocal(v: unknown): any {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export const depositService = {
  async requestDeposit(params: {
    chequeId: string;
    destinationBankAccountId: string;
    actorId: string;
    actorRole: "client";
    clientId: string;
    req?: Request;
  }) {
    const chequeRow = await depositModel.findChequeRowById(params.chequeId);
    if (!chequeRow) throw new Error("Cheque not found");
    if (String(chequeRow._client_id) !== params.clientId) throw new Error("Cheque does not belong to client");

    const tableName = String(chequeRow._table_name || (await getClientTableName(params.clientId)));
    await ensureClientTableDepositColumns(tableName);

    const currentStatus = chequeRow.cheque_status as string | null;
    if (currentStatus === "deposit_requested" || currentStatus === "deposited") {
      throw new Error("Deposit already requested");
    }

    const bank = await bankAccountModel.findActiveByIdAndClient(params.destinationBankAccountId, params.clientId);
    if (!bank) throw new Error("Bank account not found");

    const now = new Date();

    // Snapshot bank display fields into the cheque row for history.
    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET cheque_status = 'deposit_requested',
             deposit_requested_at = '${now.toISOString().slice(0, 19).replace("T", " ")}',
             deposit_requested_by = '${params.actorId.replace(/'/g, "''")}',
             deposit_destination_bank_account_id = '${bank.id.replace(/'/g, "''")}',
             deposit_destination_bank_name = '${bank.bankName.replace(/'/g, "''")}',
             deposit_destination_bank_nickname = '${bank.nickname.replace(/'/g, "''")}',
             deposit_destination_bank_last4 = '${bank.accountLast4.replace(/'/g, "''")}',
             deposit_decision = 'pending',
             deposit_decided_by = NULL,
             deposit_decided_at = NULL,
             deposit_reject_reason = NULL,
             deposit_marked_deposited_by = NULL,
             deposit_marked_deposited_at = NULL
         WHERE id = '${params.chequeId.replace(/'/g, "''")}' AND record_type = 'cheque'`
      )
    );

    const client = await clientModel.findById(params.clientId);
    const assignedAdmin = await resolveAssignedAdmin(params.clientId);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "deposit.requested",
      entity: params.chequeId,
      clientId: params.clientId,
      after: {
        chequeId: params.chequeId,
        destinationBankAccountId: bank.id,
        destinationBankName: bank.bankName,
        destinationBankNickname: bank.nickname,
        destinationBankLast4: bank.accountLast4,
      },
      req: params.req,
      notifRecipientId: assignedAdmin?.userId,
      notifTitle: assignedAdmin ? `New Deposit Request — ${client.company_name}` : undefined,
      notifTargetUrl: assignedAdmin ? `/admin/deposits?highlight=${params.chequeId}` : undefined,
    });

    if (assignedAdmin) {
      notificationService
        .sendDepositRequestEmailToAdmin({
          adminEmail: assignedAdmin.email,
          companyName: client.company_name,
          chequeId: params.chequeId,
          amount: Number(chequeRow.cheque_amount_figures || 0),
          bankName: bank.bankName,
          bankNickname: bank.nickname,
        })
        .catch((err) => {
          console.error("[deposit] email failed:", err);
        });
    }

    return { ok: true };
  },

  async cancelRequest(params: {
    chequeId: string;
    actorId: string;
    actorRole: "client";
    clientId: string;
    req?: Request;
  }) {
    const chequeRow = await depositModel.findChequeRowById(params.chequeId);
    if (!chequeRow) throw new Error("Cheque not found");
    if (String(chequeRow._client_id) !== params.clientId) throw new Error("Not authorised");

    const currentStatus = chequeRow.cheque_status as string | null;
    if (currentStatus !== "deposit_requested") {
      throw new Error("No active deposit request to cancel");
    }

    const decision = chequeRow.deposit_decision as DepositDecision | null | string;
    if (decision === "approved" || decision === "rejected") {
      throw new Error("Cannot cancel after admin has already acted on this request");
    }

    const tableName = String(chequeRow._table_name || (await getClientTableName(params.clientId)));
    await ensureClientTableDepositColumns(tableName);

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET cheque_status = 'validated',
             deposit_requested_at = NULL,
             deposit_requested_by = NULL,
             deposit_destination_bank_account_id = NULL,
             deposit_destination_bank_name = NULL,
             deposit_destination_bank_nickname = NULL,
             deposit_destination_bank_last4 = NULL,
             deposit_decision = NULL,
             deposit_decided_by = NULL,
             deposit_decided_at = NULL,
             deposit_reject_reason = NULL,
             deposit_marked_deposited_by = NULL,
             deposit_marked_deposited_at = NULL,
             deposit_slip_url = NULL,
             deposit_slip_uploaded_at = NULL,
             deposit_slip_uploaded_by = NULL,
             deposit_slip_ai_result = NULL
         WHERE id = '${params.chequeId.replace(/'/g, "''")}' AND record_type = 'cheque'`
      )
    );

    const client = await clientModel.findById(params.clientId);
    const assignedAdmin = await resolveAssignedAdmin(params.clientId);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "deposit.cancelled",
      entity: params.chequeId,
      clientId: params.clientId,
      after: { chequeId: params.chequeId },
      req: params.req,
      notifRecipientId: assignedAdmin?.userId,
      notifTitle: assignedAdmin ? `Deposit cancelled — ${client.company_name}` : undefined,
      notifTargetUrl: assignedAdmin ? `/admin/deposits?highlight=${encodeURIComponent(params.chequeId)}` : undefined,
    });

    if (assignedAdmin) {
      notificationService
        .sendDepositCancelledEmailToAdmin({
          adminEmail: assignedAdmin.email,
          companyName: client.company_name,
          chequeId: params.chequeId,
          amount: Number(chequeRow.cheque_amount_figures || 0),
        })
        .catch((err) => {
          console.error("[deposit] cancel email failed:", err);
        });
    }

    return { ok: true };
  },

  async listMine(params: { clientId: string; limit?: number }) {
    return depositModel.listForClient(params.clientId, { limit: params.limit });
  },

  async adminList(params?: { limit?: number }) {
    return depositModel.listAllForAdmin({ limit: params?.limit });
  },

  async adminDecide(params: {
    chequeId: string;
    decision: DepositDecision;
    actorId: string;
    actorRole: "admin" | "super_admin";
    decisionDate?: string; // YYYY/MM/DD from UI
    rejectReason?: string;
    req?: Request;
  }) {
    const chequeRow = await depositModel.findChequeRowById(params.chequeId);
    if (!chequeRow) throw new Error("Cheque not found");

    const clientId = String(chequeRow._client_id);
    const tableName = String(chequeRow._table_name || (await getClientTableName(clientId)));
    await ensureClientTableDepositColumns(tableName);

    const currentStatus = chequeRow.cheque_status as string | null;
    if (currentStatus !== "deposit_requested") {
      throw new Error("Cheque is not in deposit_requested state");
    }

    const now = new Date();
    const decidedAt = params.decisionDate ? parseYyyyMmDd(params.decisionDate) : null;
    const decidedAtSql = (decidedAt ?? now).toISOString().slice(0, 19).replace("T", " ");

    const rejectReason = params.decision === "rejected" ? String(params.rejectReason || "").trim() : "";
    if (params.decision === "rejected" && !rejectReason) throw new Error("Reject reason is required");

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET deposit_decision = '${params.decision}',
             deposit_decided_by = '${params.actorId.replace(/'/g, "''")}',
             deposit_decided_at = '${decidedAtSql}',
             deposit_reject_reason = ${params.decision === "rejected" ? `'${rejectReason.replace(/'/g, "''")}'` : "NULL"}
         WHERE id = '${params.chequeId.replace(/'/g, "''")}' AND record_type = 'cheque'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: `deposit.${params.decision}`,
      entity: params.chequeId,
      clientId,
      after: {
        chequeId: params.chequeId,
        decision: params.decision,
        decidedAt: decidedAtSql,
        rejectReason: params.decision === "rejected" ? rejectReason : undefined,
      },
      req: params.req,
    });

    {
      const clientUser = await resolveClientUser(clientId);
      if (clientUser) {
        const recipients = uniqueRecipientEmails(clientUser.orgEmail, clientUser.userEmail);
        const amount = Number(chequeRow.cheque_amount_figures || 0);
        const bankName = String(chequeRow.deposit_destination_bank_name || "");

        await auditService.log({
          actor: params.actorId,
          actor_role: params.actorRole,
          action: `deposit.${params.decision}`,
          entity: params.chequeId,
          clientId,
          after: { chequeId: params.chequeId, decision: params.decision },
          req: params.req,
          notifRecipientId: clientUser.userId,
          notifTitle: params.decision === "approved" ? "Deposit request approved" : "Deposit request rejected",
          notifTargetUrl: `/customer/${clientId}/deposits`,
        });

        for (const toEmail of recipients) {
          if (params.decision === "approved") {
            notificationService
              .sendDepositApprovedEmailToClient({
                toEmail,
                chequeId: params.chequeId,
                amount,
                bankName: bankName || "—",
              })
              .catch((err) => console.error("[deposit] approved email failed:", err));
          } else {
            notificationService
              .sendDepositRejectedEmailToClient({
                toEmail,
                chequeId: params.chequeId,
                amount,
                reason: rejectReason,
              })
              .catch((err) => console.error("[deposit] rejected email failed:", err));
          }
        }
      }
    }

    return { ok: true };
  },

  async adminMarkDeposited(params: {
    chequeId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    req?: Request;
  }) {
    const chequeRow = await depositModel.findChequeRowById(params.chequeId);
    if (!chequeRow) throw new Error("Cheque not found");

    const clientId = String(chequeRow._client_id);
    const tableName = String(chequeRow._table_name || (await getClientTableName(clientId)));
    await ensureClientTableDepositColumns(tableName);

    const decision = chequeRow.deposit_decision as DepositDecision | null;
    if (decision && decision !== "approved") {
      throw new Error("Cannot mark deposited unless approved");
    }

    const ai = tryParseJsonLocal((chequeRow as any).deposit_slip_ai_result);

    const now = new Date();
    const nowSql = now.toISOString().slice(0, 19).replace("T", " ");

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET cheque_status = 'deposited',
             deposit_marked_deposited_by = '${params.actorId.replace(/'/g, "''")}',
             deposit_marked_deposited_at = '${nowSql}'
         WHERE id = '${params.chequeId.replace(/'/g, "''")}' AND record_type = 'cheque'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "deposit.mark_deposited",
      entity: params.chequeId,
      clientId,
      after: { chequeId: params.chequeId, markedDepositedAt: nowSql },
      req: params.req,
    });

    {
      const clientUser = await resolveClientUser(clientId);
      if (clientUser) {
        const recipients = uniqueRecipientEmails(clientUser.orgEmail, clientUser.userEmail);
        const amount = Number(chequeRow.cheque_amount_figures || 0);

        await auditService.log({
          actor: params.actorId,
          actor_role: params.actorRole,
          action: "deposit.mark_deposited",
          entity: params.chequeId,
          clientId,
          after: { chequeId: params.chequeId },
          req: params.req,
          notifRecipientId: clientUser.userId,
          notifTitle: "Your cheque has been deposited",
          notifTargetUrl: `/customer/${clientId}/deposits`,
        });

        for (const toEmail of recipients) {
          notificationService
            .sendDepositCompletedEmailToClient({
              toEmail,
              chequeId: params.chequeId,
              amount,
              slipDate: ai?.deposit_date ?? null,
              slipAmount: typeof ai?.amount === "number" && Number.isFinite(ai.amount) ? ai.amount : null,
              slipReference: ai?.reference ?? null,
              slipBankName: ai?.bank_name ?? null,
              slipAccountLast4: ai?.account_last4 ?? null,
            })
            .catch((err) => console.error("[deposit] completed email failed:", err));
        }
      }
    }

    return { ok: true };
  },

  async uploadSlip(params: {
    chequeId: string;
    actorId: string;
    actorRole: "admin" | "super_admin";
    fileName: string;
    fileBuffer: Buffer;
    fileContentType?: string;
    req?: Request;
  }) {
    const chequeRow = await depositModel.findChequeRowById(params.chequeId);
    if (!chequeRow) throw new Error("Cheque not found");

    const clientId = String(chequeRow._client_id);
    const tableName = String(chequeRow._table_name || (await getClientTableName(clientId)));
    await ensureClientTableDepositColumns(tableName);

    const now = new Date();
    const nowSql = now.toISOString().slice(0, 19).replace("T", " ");

    const ext = (() => {
      const m = /\.([a-zA-Z0-9]+)$/.exec(params.fileName || "");
      const e = m?.[1]?.toLowerCase();
      if (!e) return "jpg";
      if (["jpg", "jpeg", "png", "webp"].includes(e)) return e === "jpeg" ? "jpg" : e;
      return "jpg";
    })();

    const slipPath = `deposits/${params.chequeId}/slip-${Date.now()}.${ext}`;
    const slipUrl = await storageService.upload(slipPath, params.fileBuffer, params.fileContentType);

    const slipBase64 = params.fileBuffer.toString("base64");
    const extracted = await aiService.extractDepositSlipFields(slipBase64);

    const chequeAmount = Number(chequeRow.cheque_amount_figures || 0);
    const extractedAmount = typeof extracted.amount === "number" ? extracted.amount : null;
    const amountMatches = extractedAmount !== null && Math.abs(extractedAmount - chequeAmount) < 0.01;
    const validationIssues: string[] = [];
    if (extractedAmount === null) validationIssues.push("Could not detect amount on slip");
    if (extractedAmount !== null && !amountMatches) {
      validationIssues.push(`Slip amount (${extractedAmount}) does not match cheque amount (${chequeAmount})`);
    }

    // Full account number validation (secure): hash OCR'd account_number and compare to stored HMAC hash.
    let accountNumberMatches: boolean | null = null;
    try {
      const bankAccountId = chequeRow.deposit_destination_bank_account_id as string | null;
      const bankRow = bankAccountId ? await bankAccountModel.findById(String(bankAccountId)) : null;
      const extractedDigits = extracted.account_number ? extracted.account_number.replace(/\D/g, "") : "";

      if (bankRow && extractedDigits) {
        const computed = hmacSha256Hex(extractedDigits, { keyVersion: bankRow.keyVersion as 1 });
        const stored = String(bankRow.accountNumberHash || "");

        // timing-safe compare when possible (both hex digests)
        if (/^[0-9a-f]+$/i.test(stored) && /^[0-9a-f]+$/i.test(computed.hex) && stored.length === computed.hex.length) {
          accountNumberMatches = crypto.timingSafeEqual(
            Buffer.from(stored, "hex"),
            Buffer.from(computed.hex, "hex")
          );
        } else {
          accountNumberMatches = stored === computed.hex;
        }

        if (!accountNumberMatches) {
          validationIssues.push("Account number on slip does not match destination account");
        }
      }
    } catch {
      // If anything goes wrong, keep accountNumberMatches null (unverified) and do not add a validation issue.
      accountNumberMatches = null;
    }

    // Never persist raw full account number in the AI JSON blob.
    // Keep account_last4 for display, but drop account_number before saving.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { account_number: _accountNumber, ...extractedSafe } = extracted as any;

    const aiResult = {
      ...extractedSafe,
      validation: {
        cheque_amount: chequeAmount,
        amount_matches: amountMatches,
        account_number_matches: accountNumberMatches,
        issues: validationIssues,
      },
    };

    const aiJson = JSON.stringify(aiResult).replace(/'/g, "''");

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET deposit_slip_url = '${String(slipUrl).replace(/'/g, "''")}',
             deposit_slip_uploaded_at = '${nowSql}',
             deposit_slip_uploaded_by = '${params.actorId.replace(/'/g, "''")}',
             deposit_slip_ai_result = '${aiJson}'
         WHERE id = '${params.chequeId.replace(/'/g, "''")}' AND record_type = 'cheque'`
      )
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "deposit.slip_uploaded",
      entity: params.chequeId,
      clientId,
      after: {
        chequeId: params.chequeId,
        slipUrl,
        amountMatches,
      },
      req: params.req,
    });

    return { slipUrl, aiResult };
  },
};


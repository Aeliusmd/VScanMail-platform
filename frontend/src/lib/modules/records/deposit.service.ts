import { auditService } from "@/lib/modules/audit/audit.service";
import { aiService } from "@/lib/modules/ai/ai.service";
import { bankAccountModel } from "@/lib/modules/banking/bank-account.model";
import { getClientTableName } from "@/lib/modules/core/db/dynamic-table";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { storageService } from "@/lib/modules/storage/storage.service";
import { depositModel, type DepositDecision } from "./deposit.model";

function escapeIdent(ident: string) {
  return `\`${String(ident).replace(/`/g, "``")}\``;
}

function parseYyyyMmDd(s: string): Date | null {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
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
    });

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

    const decision = chequeRow.deposit_decision as DepositDecision | null;
    if (decision && decision !== "approved") {
      throw new Error("Cannot mark deposited unless approved");
    }

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

    const aiResult = {
      ...extracted,
      validation: {
        cheque_amount: chequeAmount,
        amount_matches: amountMatches,
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


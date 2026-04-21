import { auditService } from "../audit/audit.service";
import { notificationService } from "../notifications/notification.service";
import {
  decryptField,
  encryptField,
  hmacSha256Hex,
} from "../core/crypto/field-encryption";
import { bankAccountModel } from "./bank-account.model";
import type { CreateBankAccountInput } from "./bank-account.schema";

export type BankAccountListDto = Awaited<
  ReturnType<typeof bankAccountModel.listActiveByClient>
>[number];

export const bankAccountService = {
  async listForClient(clientId: string): Promise<BankAccountListDto[]> {
    return bankAccountModel.listActiveByClient(clientId);
  },

  async createForClient(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    input: CreateBankAccountInput;
    req?: Request;
  }): Promise<BankAccountListDto> {
    const { input } = params;
    const accountLast4 = input.accountNumber.slice(-4);

    const aad = `client:${params.clientId}`;
    const accountEnc = encryptField(input.accountNumber, { aad });
    const hash = hmacSha256Hex(input.accountNumber, { keyVersion: accountEnc.keyVersion });

    const created = await bankAccountModel.createForClient({
      clientId: params.clientId,
      createdBy: params.actorId,
      bankName: input.bankName,
      nickname: input.nickname,
      accountType: input.accountType,
      accountLast4,
      accountNumberEnc: accountEnc.payload,
      keyVersion: accountEnc.keyVersion,
      accountNumberHash: hash.hex,
      isPrimary: input.isPrimary,
    });

    const dto = {
      id: created.id,
      clientId: created.clientId,
      bankName: created.bankName,
      nickname: created.nickname,
      accountType: created.accountType as any,
      accountLast4: created.accountLast4,
      isPrimary: Boolean(created.isPrimary),
      status: created.status as any,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    } satisfies BankAccountListDto;

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "bank_account.created",
      entity: created.id,
      clientId: params.clientId,
      after: {
        id: created.id,
        bankName: created.bankName,
        nickname: created.nickname,
        accountType: created.accountType,
        accountLast4: created.accountLast4,
        isPrimary: created.isPrimary,
      },
      req: params.req,
    });

    await notificationService.sendBankAccountChangeAlert(params.clientId, {
      kind: "added",
      nickname: created.nickname,
      bankName: created.bankName,
      accountLast4: created.accountLast4,
    });

    return dto;
  },

  async setPrimary(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    bankAccountId: string;
    req?: Request;
  }): Promise<void> {
    await bankAccountModel.setPrimary(params.clientId, params.bankAccountId);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "bank_account.primary_set",
      entity: params.bankAccountId,
      clientId: params.clientId,
      req: params.req,
    });
  },

  async deleteForClient(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    bankAccountId: string;
    req?: Request;
  }): Promise<void> {
    const { before } = await bankAccountModel.softDelete(
      params.clientId,
      params.bankAccountId
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "bank_account.deleted",
      entity: params.bankAccountId,
      clientId: params.clientId,
      before: {
        id: before.id,
        bankName: before.bankName,
        nickname: before.nickname,
        accountType: before.accountType,
        accountLast4: before.accountLast4,
        isPrimary: before.isPrimary,
      },
      req: params.req,
    });

    await notificationService.sendBankAccountChangeAlert(params.clientId, {
      kind: "removed",
      nickname: before.nickname,
      bankName: before.bankName,
      accountLast4: before.accountLast4,
    });
  },

  async revealForSuperAdmin(params: {
    actorId: string;
    actorRole: "super_admin";
    bankAccountId: string;
    reason: string;
    req?: Request;
  }): Promise<{
    clientId: string;
    bankName: string;
    nickname: string;
    accountType: "checking" | "savings";
    accountNumber: string;
  }> {
    const row = await bankAccountModel.findById(params.bankAccountId);
    if (!row || row.status !== "active" || row.deletedAt) {
      throw new Error("Bank account not found");
    }

    const aad = `client:${row.clientId}`;
    const accountNumber = decryptField(
      { keyVersion: row.keyVersion as any, payload: row.accountNumberEnc as any },
      { aad }
    );

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "bank_account.revealed",
      entity: params.bankAccountId,
      clientId: row.clientId,
      after: {
        reason: params.reason,
        targetClientId: row.clientId,
        bankAccountId: row.id,
      },
      req: params.req,
    });

    return {
      clientId: row.clientId,
      bankName: row.bankName,
      nickname: row.nickname,
      accountType: row.accountType as any,
      accountNumber,
    };
  },
};


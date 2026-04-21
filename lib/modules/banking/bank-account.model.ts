import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../core/db/mysql";
import { clientBankAccounts } from "../core/db/schema";

export type BankAccountRow = typeof clientBankAccounts.$inferSelect;

export type BankAccountListItem = {
  id: string;
  clientId: string;
  bankName: string;
  nickname: string;
  accountType: "checking" | "savings";
  accountLast4: string;
  isPrimary: boolean;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

function toListItem(r: BankAccountRow): BankAccountListItem {
  return {
    id: r.id,
    clientId: r.clientId,
    bankName: r.bankName,
    nickname: r.nickname,
    accountType: r.accountType as any,
    accountLast4: r.accountLast4,
    isPrimary: Boolean(r.isPrimary),
    status: r.status as any,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export const bankAccountModel = {
  async listActiveByClient(clientId: string): Promise<BankAccountListItem[]> {
    const rows = await db
      .select()
      .from(clientBankAccounts)
      .where(
        and(
          eq(clientBankAccounts.clientId, clientId),
          eq(clientBankAccounts.status, "active"),
          isNull(clientBankAccounts.deletedAt)
        )
      )
      .orderBy(desc(clientBankAccounts.isPrimary), desc(clientBankAccounts.createdAt));

    return rows.map(toListItem);
  },

  async findById(id: string): Promise<BankAccountRow | null> {
    const rows = await db
      .select()
      .from(clientBankAccounts)
      .where(eq(clientBankAccounts.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async findActiveByIdAndClient(id: string, clientId: string): Promise<BankAccountRow | null> {
    const rows = await db
      .select()
      .from(clientBankAccounts)
      .where(
        and(
          eq(clientBankAccounts.id, id),
          eq(clientBankAccounts.clientId, clientId),
          eq(clientBankAccounts.status, "active"),
          isNull(clientBankAccounts.deletedAt)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async createForClient(input: {
    clientId: string;
    createdBy: string;
    bankName: string;
    nickname: string;
    accountType: "checking" | "savings";
    accountLast4: string;
    accountNumberEnc: Buffer;
    accountNumberHash: string;
    keyVersion: number;
    isPrimary?: boolean;
  }): Promise<BankAccountRow> {
    const id = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
      const activeCount = await tx
        .select({ cnt: sql<number>`count(*)` })
        .from(clientBankAccounts)
        .where(
          and(
            eq(clientBankAccounts.clientId, input.clientId),
            eq(clientBankAccounts.status, "active"),
            isNull(clientBankAccounts.deletedAt)
          )
        );

      const shouldBePrimary = Boolean(input.isPrimary) || (activeCount[0]?.cnt ?? 0) === 0;

      if (shouldBePrimary) {
        await tx
          .update(clientBankAccounts)
          .set({ isPrimary: false, updatedAt: now })
          .where(
            and(
              eq(clientBankAccounts.clientId, input.clientId),
              eq(clientBankAccounts.status, "active"),
              isNull(clientBankAccounts.deletedAt)
            )
          );
      }

      await tx.insert(clientBankAccounts).values({
        id,
        clientId: input.clientId,
        bankName: input.bankName,
        nickname: input.nickname,
        accountType: input.accountType,
        accountLast4: input.accountLast4,
        accountNumberEnc: input.accountNumberEnc,
        keyVersion: input.keyVersion,
        accountNumberHash: input.accountNumberHash,
        isPrimary: shouldBePrimary,
        status: "active",
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });

    const created = await this.findById(id);
    if (!created) throw new Error("Failed to create bank account");
    return created;
  },

  async setPrimary(clientId: string, id: string): Promise<void> {
    const now = new Date();
    await db.transaction(async (tx) => {
      const target = await tx
        .select({ id: clientBankAccounts.id })
        .from(clientBankAccounts)
        .where(
          and(
            eq(clientBankAccounts.id, id),
            eq(clientBankAccounts.clientId, clientId),
            eq(clientBankAccounts.status, "active"),
            isNull(clientBankAccounts.deletedAt)
          )
        )
        .limit(1);

      if (!target[0]) throw new Error("Bank account not found");

      await tx
        .update(clientBankAccounts)
        .set({ isPrimary: false, updatedAt: now })
        .where(
          and(
            eq(clientBankAccounts.clientId, clientId),
            eq(clientBankAccounts.status, "active"),
            isNull(clientBankAccounts.deletedAt)
          )
        );

      await tx
        .update(clientBankAccounts)
        .set({ isPrimary: true, updatedAt: now })
        .where(eq(clientBankAccounts.id, id));
    });
  },

  async softDelete(clientId: string, id: string): Promise<{ before: BankAccountRow; after: BankAccountRow }> {
    const now = new Date();

    let before: BankAccountRow | null = null;
    let after: BankAccountRow | null = null;

    await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(clientBankAccounts)
        .where(
          and(
            eq(clientBankAccounts.id, id),
            eq(clientBankAccounts.clientId, clientId),
            eq(clientBankAccounts.status, "active"),
            isNull(clientBankAccounts.deletedAt)
          )
        )
        .limit(1);

      before = rows[0] ?? null;
      if (!before) throw new Error("Bank account not found");

      await tx
        .update(clientBankAccounts)
        .set({
          status: "disabled",
          isPrimary: false,
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(clientBankAccounts.id, id));

      // If we deleted the primary account, pick the most recent remaining active as primary.
      if (before.isPrimary) {
        const remaining = await tx
          .select({ id: clientBankAccounts.id })
          .from(clientBankAccounts)
          .where(
            and(
              eq(clientBankAccounts.clientId, clientId),
              eq(clientBankAccounts.status, "active"),
              isNull(clientBankAccounts.deletedAt)
            )
          )
          .orderBy(desc(clientBankAccounts.createdAt))
          .limit(1);

        if (remaining[0]) {
          await tx
            .update(clientBankAccounts)
            .set({ isPrimary: true, updatedAt: now })
            .where(eq(clientBankAccounts.id, remaining[0].id));
        }
      }

      const updated = await tx
        .select()
        .from(clientBankAccounts)
        .where(eq(clientBankAccounts.id, id))
        .limit(1);
      after = updated[0] ?? null;
    });

    if (!before || !after) throw new Error("Failed to delete bank account");
    return { before, after };
  },
};


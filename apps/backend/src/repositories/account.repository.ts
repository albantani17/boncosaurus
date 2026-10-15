import { and, asc, count, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { accounts, transactions } from '../db/schema';
import type {
  Account,
  AccountPatch,
  IncomingTransferTotal,
  NewAccount,
  OutgoingTotals
} from '../types/finance.types';

export type AccountRepository = {
  list(workspaceId: string): Promise<Account[]>;
  findById(workspaceId: string, id: string): Promise<Account | undefined>;
  insert(values: NewAccount): Promise<Account>;
  update(workspaceId: string, id: string, patch: AccountPatch): Promise<Account | undefined>;
  delete(workspaceId: string, id: string): Promise<void>;
  countTransactions(workspaceId: string, id: string): Promise<number>;
  sumOutgoing(workspaceId: string): Promise<OutgoingTotals[]>;
  sumIncomingTransfers(workspaceId: string): Promise<IncomingTransferTotal[]>;
};

const inWorkspace = (workspaceId: string, id: string) =>
  and(eq(accounts.workspaceId, workspaceId), eq(accounts.id, id));

const sumWhen = (type: 'income' | 'expense' | 'transfer') =>
  sql<number>`coalesce(sum(case when ${transactions.type} = ${type} then ${transactions.amount} end), 0)`.mapWith(
    Number
  );

export const accountRepository: AccountRepository = {
  list: (workspaceId) =>
    db
      .select()
      .from(accounts)
      .where(eq(accounts.workspaceId, workspaceId))
      .orderBy(asc(accounts.sortOrder), asc(accounts.name)),

  async findById(workspaceId, id) {
    const [row] = await db.select().from(accounts).where(inWorkspace(workspaceId, id));
    return row;
  },

  async insert(values) {
    const [row] = await db.insert(accounts).values(values).returning();
    return row!;
  },

  async update(workspaceId, id, patch) {
    const [row] = await db
      .update(accounts)
      .set(patch)
      .where(inWorkspace(workspaceId, id))
      .returning();
    return row;
  },

  async delete(workspaceId, id) {
    await db.delete(accounts).where(inWorkspace(workspaceId, id));
  },

  async countTransactions(workspaceId, id) {
    const [row] = await db
      .select({ total: count() })
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          or(eq(transactions.accountId, id), eq(transactions.toAccountId, id))
        )
      );
    return row?.total ?? 0;
  },

  sumOutgoing: (workspaceId) =>
    db
      .select({
        accountId: transactions.accountId,
        income: sumWhen('income'),
        expense: sumWhen('expense'),
        transferOut: sql<number>`coalesce(sum(case when ${transactions.type} = 'transfer' then ${transactions.amount} + coalesce(${transactions.fee}, 0) end), 0)`.mapWith(
          Number
        )
      })
      .from(transactions)
      .where(and(eq(transactions.workspaceId, workspaceId), isNull(transactions.deletedAt)))
      .groupBy(transactions.accountId),

  sumIncomingTransfers: (workspaceId) =>
    db
      .select({
        accountId: sql<string>`${transactions.toAccountId}`,
        transferIn: sql<number>`sum(coalesce(${transactions.toAmount}, ${transactions.amount}))`.mapWith(
          Number
        )
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          eq(transactions.type, 'transfer'),
          isNull(transactions.deletedAt)
        )
      )
      .groupBy(transactions.toAccountId)
};

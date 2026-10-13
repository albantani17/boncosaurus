import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { db } from '../db';
import { transactions } from '../db/schema';
import type {
  NewTransaction,
  Transaction,
  TransactionFilters,
  TransactionPatch
} from '../types/finance.types';

export type TransactionRepository = {
  list(workspaceId: string, filters: TransactionFilters): Promise<Transaction[]>;
  findById(workspaceId: string, id: string): Promise<Transaction | undefined>;
  insert(values: NewTransaction): Promise<Transaction>;
  update(workspaceId: string, id: string, patch: TransactionPatch): Promise<Transaction | undefined>;
  softDelete(workspaceId: string, id: string): Promise<boolean>;
};

const activeInWorkspace = (workspaceId: string, id: string) =>
  and(
    eq(transactions.workspaceId, workspaceId),
    eq(transactions.id, id),
    isNull(transactions.deletedAt)
  );

export const transactionRepository: TransactionRepository = {
  list: (workspaceId, filters) =>
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          isNull(transactions.deletedAt),
          filters.type ? eq(transactions.type, filters.type) : undefined,
          filters.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
          filters.accountId
            ? or(
                eq(transactions.accountId, filters.accountId),
                eq(transactions.toAccountId, filters.accountId)
              )
            : undefined,
          filters.from ? gte(transactions.occurredAt, filters.from) : undefined,
          filters.to ? lte(transactions.occurredAt, filters.to) : undefined
        )
      )
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(filters.limit)
      .offset(filters.offset),

  async findById(workspaceId, id) {
    const [row] = await db.select().from(transactions).where(activeInWorkspace(workspaceId, id));
    return row;
  },

  async insert(values) {
    const [row] = await db.insert(transactions).values(values).returning();
    return row!;
  },

  async update(workspaceId, id, patch) {
    const [row] = await db
      .update(transactions)
      .set(patch)
      .where(activeInWorkspace(workspaceId, id))
      .returning();
    return row;
  },

  async softDelete(workspaceId, id) {
    const rows = await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(activeInWorkspace(workspaceId, id))
      .returning({ id: transactions.id });
    return rows.length > 0;
  }
};

import { and, gte, isNull, eq, lte } from 'drizzle-orm';
import { db } from '../db';
import { accounts, categories, transactions } from '../db/schema';
import type { NewAccount, NewCategory, NewTransaction, Transaction } from '../types/finance.types';

export type ImportBatch = {
  accounts: NewAccount[];
  categories: NewCategory[];
  transactions: NewTransaction[];
};

export type ImportRepository = {
  listTransactionsInRange(workspaceId: string, from: Date, to: Date): Promise<Transaction[]>;
  commit(batch: ImportBatch): Promise<void>;
};

const INSERT_CHUNK_SIZE = 500;

export const importRepository: ImportRepository = {
  listTransactionsInRange: (workspaceId, from, to) =>
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          isNull(transactions.deletedAt),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to)
        )
      ),

  async commit(batch) {
    await db.transaction(async (tx) => {
      if (batch.accounts.length > 0) await tx.insert(accounts).values(batch.accounts);
      if (batch.categories.length > 0) await tx.insert(categories).values(batch.categories);
      for (let start = 0; start < batch.transactions.length; start += INSERT_CHUNK_SIZE) {
        await tx.insert(transactions).values(batch.transactions.slice(start, start + INSERT_CHUNK_SIZE));
      }
    });
  }
};

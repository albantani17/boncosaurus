import { and, eq, gte, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';
import { db } from '../db';
import { accounts, transactions } from '../db/schema';
import type { CategoryTotalRow, DateRange, TotalsRow } from '../types/report.types';
import type { TransferFeeRow } from '../utils/report/add-transfer-fees';

export type ReportRepository = {
  sumByCurrencyAndType(workspaceId: string, range: DateRange): Promise<TotalsRow[]>;
  sumByCategory(workspaceId: string, range: DateRange): Promise<CategoryTotalRow[]>;
  sumTransferFees(workspaceId: string, range: DateRange): Promise<TransferFeeRow[]>;
};

const totalAmount = sql<number>`coalesce(sum(${transactions.amount}), 0)`.mapWith(Number);

const nonTransfersInRange = (workspaceId: string, { from, to }: DateRange) =>
  and(
    eq(transactions.workspaceId, workspaceId),
    isNull(transactions.deletedAt),
    ne(transactions.type, 'transfer'),
    gte(transactions.occurredAt, from),
    lte(transactions.occurredAt, to)
  );

export const reportRepository: ReportRepository = {
  sumTransferFees: (workspaceId, { from, to }) =>
    db
      .select({
        currency: accounts.currency,
        total: sql<number>`coalesce(sum(${transactions.fee}), 0)`.mapWith(Number)
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          isNull(transactions.deletedAt),
          eq(transactions.type, 'transfer'),
          isNotNull(transactions.fee),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to)
        )
      )
      .groupBy(accounts.currency),

  sumByCurrencyAndType: (workspaceId, range) =>
    db
      .select({ currency: accounts.currency, type: transactions.type, total: totalAmount })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(nonTransfersInRange(workspaceId, range))
      .groupBy(accounts.currency, transactions.type),

  sumByCategory: (workspaceId, range) =>
    db
      .select({
        categoryId: transactions.categoryId,
        type: transactions.type,
        currency: accounts.currency,
        total: totalAmount
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(nonTransfersInRange(workspaceId, range))
      .groupBy(transactions.categoryId, transactions.type, accounts.currency)
};

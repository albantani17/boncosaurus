import { and, eq, gte, isNotNull, isNull, lte, ne, sql } from 'drizzle-orm';
import { db } from '../db';
import { alias } from 'drizzle-orm/pg-core';
import { accounts, debts, transactions } from '../db/schema';
import type { CategoryTotalRow, DateRange, TotalsRow } from '../types/report.types';
import type { TransferFeeRow } from '../domain/report/add-transfer-fees';
import type { DebtCategoryAmountRow, DebtWriteOffRow } from '../domain/report/build-debt-adjustments';

export type ReportRepository = {
  sumByCurrencyAndType(workspaceId: string, range: DateRange): Promise<TotalsRow[]>;
  sumByCategory(workspaceId: string, range: DateRange): Promise<CategoryTotalRow[]>;
  sumTransferFees(workspaceId: string, range: DateRange): Promise<TransferFeeRow[]>;
  sumSplitShares(workspaceId: string, range: DateRange): Promise<DebtCategoryAmountRow[]>;
  sumCreditPurchases(workspaceId: string, range: DateRange): Promise<DebtCategoryAmountRow[]>;
  sumWriteOffs(workspaceId: string, range: DateRange): Promise<DebtWriteOffRow[]>;
};

const totalAmount = sql<number>`coalesce(sum(${transactions.amount}), 0)`.mapWith(Number);

const nonTransfersInRange = (workspaceId: string, { from, to }: DateRange) =>
  and(
    eq(transactions.workspaceId, workspaceId),
    isNull(transactions.deletedAt),
    ne(transactions.type, 'transfer'),
    sql`${transactions.debtRole} IS DISTINCT FROM 'principal'`,
    gte(transactions.occurredAt, from),
    lte(transactions.occurredAt, to)
  );

const totalPrincipal = sql<number>`coalesce(sum(${debts.principal}), 0)`.mapWith(Number);
const originTransactions = alias(transactions, 'origin_transactions');

export const reportRepository: ReportRepository = {
  sumSplitShares: (workspaceId, { from, to }) =>
    db
      .select({ categoryId: transactions.categoryId, currency: debts.currency, total: totalPrincipal })
      .from(debts)
      .innerJoin(transactions, eq(transactions.id, debts.originTransactionId))
      .where(
        and(
          eq(debts.workspaceId, workspaceId),
          eq(debts.origin, 'split'),
          isNull(debts.deletedAt),
          isNull(transactions.deletedAt),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to)
        )
      )
      .groupBy(transactions.categoryId, debts.currency),

  sumCreditPurchases: (workspaceId, { from, to }) =>
    db
      .select({ categoryId: debts.categoryId, currency: debts.currency, total: totalPrincipal })
      .from(debts)
      .where(
        and(
          eq(debts.workspaceId, workspaceId),
          eq(debts.origin, 'purchase'),
          isNull(debts.deletedAt),
          gte(debts.originatedAt, from),
          lte(debts.originatedAt, to)
        )
      )
      .groupBy(debts.categoryId, debts.currency),

  sumWriteOffs: (workspaceId, { from, to }) =>
    db
      .select({
        direction: debts.direction,
        categoryId: originTransactions.categoryId,
        currency: debts.currency,
        total: sql<number>`coalesce(sum(${debts.writtenOffAmount}), 0)`.mapWith(Number)
      })
      .from(debts)
      .leftJoin(originTransactions, eq(originTransactions.id, debts.originTransactionId))
      .where(
        and(
          eq(debts.workspaceId, workspaceId),
          eq(debts.status, 'written_off'),
          isNull(debts.deletedAt),
          gte(debts.closedAt, from),
          lte(debts.closedAt, to)
        )
      )
      .groupBy(debts.direction, originTransactions.categoryId, debts.currency),

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

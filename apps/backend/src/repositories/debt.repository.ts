import { and, asc, desc, eq, getTableColumns, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { counterparties, debtInstallments, debtPayments, debts, transactions } from '../db/schema';
import type {
  DebtFilters,
  DebtInstallment,
  DebtPatch,
  DebtPayment,
  DebtWithCounterparty,
  NewCounterparty,
  NewDebt,
  NewDebtInstallment,
  NewDebtPayment
} from '../types/debt.types';
import type { NewTransaction } from '../types/finance.types';

export type DebtCreation = {
  counterparty?: NewCounterparty;
  debt: NewDebt & { id: string };
  disbursement?: NewTransaction & { id: string };
  installments: NewDebtInstallment[];
};

export type SplitExpenseCreation = {
  transaction: NewTransaction;
  counterparties: NewCounterparty[];
  debts: NewDebt[];
};

export type DebtUpdate = {
  patch: DebtPatch;
  /** Replaces the schedule when set; an empty list removes it. */
  installments?: NewDebtInstallment[];
  disbursementAmount?: number;
};

export type PaymentRecord = {
  payment: NewDebtPayment;
  transactions: NewTransaction[];
  debtPatch: DebtPatch;
};

export type DebtRepository = {
  list(workspaceId: string, filters: DebtFilters): Promise<DebtWithCounterparty[]>;
  findById(workspaceId: string, id: string): Promise<DebtWithCounterparty | undefined>;
  listInstallments(workspaceId: string, debtIds: string[]): Promise<DebtInstallment[]>;
  listPayments(workspaceId: string, debtIds: string[]): Promise<DebtPayment[]>;
  sumSplitsForTransaction(workspaceId: string, transactionId: string): Promise<number>;
  create(creation: DebtCreation): Promise<void>;
  createSplitExpense(creation: SplitExpenseCreation): Promise<void>;
  update(workspaceId: string, id: string, update: DebtUpdate): Promise<void>;
  recordPayment(workspaceId: string, record: PaymentRecord): Promise<void>;
  deletePayment(workspaceId: string, payment: DebtPayment, debtPatch: DebtPatch): Promise<void>;
  softDelete(workspaceId: string, id: string): Promise<void>;
};

const debtColumns = {
  ...getTableColumns(debts),
  counterpartyName: counterparties.name,
  counterpartyKind: counterparties.kind,
  accountId: transactions.accountId
};

const selectDebts = () =>
  db
    .select(debtColumns)
    .from(debts)
    .innerJoin(counterparties, eq(counterparties.id, debts.counterpartyId))
    .leftJoin(transactions, eq(transactions.id, debts.disbursementTransactionId));

const activeDebt = (workspaceId: string, id: string) =>
  and(eq(debts.workspaceId, workspaceId), eq(debts.id, id), isNull(debts.deletedAt));

export const debtRepository: DebtRepository = {
  list: (workspaceId, filters) =>
    selectDebts()
      .where(
        and(
          eq(debts.workspaceId, workspaceId),
          isNull(debts.deletedAt),
          filters.direction ? eq(debts.direction, filters.direction) : undefined,
          filters.status ? eq(debts.status, filters.status) : undefined,
          filters.counterpartyId ? eq(debts.counterpartyId, filters.counterpartyId) : undefined
        )
      )
      .orderBy(desc(debts.originatedAt), desc(debts.id)),

  async findById(workspaceId, id) {
    const [row] = await selectDebts().where(activeDebt(workspaceId, id));
    return row;
  },

  listInstallments: async (workspaceId, debtIds) =>
    debtIds.length === 0
      ? []
      : db
          .select()
          .from(debtInstallments)
          .where(and(eq(debtInstallments.workspaceId, workspaceId), inArray(debtInstallments.debtId, debtIds)))
          .orderBy(asc(debtInstallments.sequence)),

  listPayments: async (workspaceId, debtIds) =>
    debtIds.length === 0
      ? []
      : db
          .select()
          .from(debtPayments)
          .where(and(eq(debtPayments.workspaceId, workspaceId), inArray(debtPayments.debtId, debtIds)))
          .orderBy(asc(debtPayments.paidAt), asc(debtPayments.id)),

  async sumSplitsForTransaction(workspaceId, transactionId) {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${debts.principal}), 0)`.mapWith(Number) })
      .from(debts)
      .where(
        and(
          eq(debts.workspaceId, workspaceId),
          eq(debts.originTransactionId, transactionId),
          isNull(debts.deletedAt)
        )
      );
    return row?.total ?? 0;
  },

  // The disbursement and the debt point at each other, so the link is set after both exist.
  async create({ counterparty, debt, disbursement, installments }) {
    await db.transaction(async (tx) => {
      if (counterparty) await tx.insert(counterparties).values(counterparty);
      if (disbursement) await tx.insert(transactions).values(disbursement);
      await tx.insert(debts).values(debt);
      if (disbursement) {
        await tx
          .update(transactions)
          .set({ debtId: debt.id, debtRole: 'principal' })
          .where(eq(transactions.id, disbursement.id));
      }
      if (installments.length > 0) await tx.insert(debtInstallments).values(installments);
    });
  },

  async createSplitExpense({ transaction, counterparties: newCounterparties, debts: newDebts }) {
    await db.transaction(async (tx) => {
      if (newCounterparties.length > 0) await tx.insert(counterparties).values(newCounterparties);
      await tx.insert(transactions).values(transaction);
      await tx.insert(debts).values(newDebts);
    });
  },

  async update(workspaceId, id, { patch, installments, disbursementAmount }) {
    await db.transaction(async (tx) => {
      const [debt] = await tx.update(debts).set(patch).where(activeDebt(workspaceId, id)).returning();
      if (installments) {
        await tx
          .delete(debtInstallments)
          .where(and(eq(debtInstallments.workspaceId, workspaceId), eq(debtInstallments.debtId, id)));
        if (installments.length > 0) await tx.insert(debtInstallments).values(installments);
      }
      if (disbursementAmount !== undefined && debt?.disbursementTransactionId) {
        await tx
          .update(transactions)
          .set({ amount: disbursementAmount })
          .where(
            and(eq(transactions.workspaceId, workspaceId), eq(transactions.id, debt.disbursementTransactionId))
          );
      }
    });
  },

  async recordPayment(workspaceId, { payment, transactions: newTransactions, debtPatch }) {
    await db.transaction(async (tx) => {
      if (newTransactions.length > 0) await tx.insert(transactions).values(newTransactions);
      await tx.insert(debtPayments).values(payment);
      await tx.update(debts).set(debtPatch).where(activeDebt(workspaceId, payment.debtId));
    });
  },

  async deletePayment(workspaceId, payment, debtPatch) {
    const transactionIds = [payment.repaymentTransactionId, payment.chargeTransactionId].filter(
      (id): id is string => id !== null
    );
    await db.transaction(async (tx) => {
      await tx
        .delete(debtPayments)
        .where(and(eq(debtPayments.workspaceId, workspaceId), eq(debtPayments.id, payment.id)));
      if (transactionIds.length > 0) {
        await tx
          .update(transactions)
          .set({ deletedAt: new Date() })
          .where(and(eq(transactions.workspaceId, workspaceId), inArray(transactions.id, transactionIds)));
      }
      await tx.update(debts).set(debtPatch).where(activeDebt(workspaceId, payment.debtId));
    });
  },

  async softDelete(workspaceId, id) {
    await db.transaction(async (tx) => {
      const deletedAt = new Date();
      await tx.update(debts).set({ deletedAt }).where(activeDebt(workspaceId, id));
      await tx
        .update(transactions)
        .set({ deletedAt })
        .where(and(eq(transactions.workspaceId, workspaceId), eq(transactions.debtId, id), isNull(transactions.deletedAt)));
    });
  }
};

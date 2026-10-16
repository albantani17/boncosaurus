import type { DebtRepository } from '../../repositories/debt.repository';
import type { DebtInstallment, DebtPayment, DebtWithCounterparty } from '../../types/debt.types';
import type { Account, Category, Transaction } from '../../types/finance.types';

const now = new Date('2026-10-16T03:00:00Z');

export const makeDebt = (overrides: Partial<DebtWithCounterparty> = {}): DebtWithCounterparty => ({
  id: 'debt-1',
  workspaceId: 'ws',
  direction: 'receivable',
  sourceType: 'personal',
  origin: 'cash',
  counterpartyId: 'cp-1',
  title: 'Pinjam',
  currency: 'IDR',
  principal: 30_000,
  originatedAt: now,
  dueDate: null,
  reminderDays: 0,
  status: 'active',
  closedAt: null,
  writtenOffAmount: null,
  note: null,
  categoryId: null,
  disbursementTransactionId: 'tx-d',
  originTransactionId: null,
  createdBy: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  counterpartyName: 'Sultan',
  counterpartyKind: 'person',
  accountId: 'acc-1',
  ...overrides
});

export const makePayment = (overrides: Partial<DebtPayment> = {}): DebtPayment => ({
  id: 'pay-1',
  workspaceId: 'ws',
  debtId: 'debt-1',
  accountId: 'acc-1',
  paidAt: now,
  amount: 10_000,
  principalAmount: 10_000,
  extraAmount: 0,
  repaymentTransactionId: 'tx-r',
  chargeTransactionId: null,
  note: null,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

export const makeInstallment = (overrides: Partial<DebtInstallment> = {}): DebtInstallment => ({
  id: 'inst-1',
  workspaceId: 'ws',
  debtId: 'debt-1',
  sequence: 1,
  dueDate: '2026-11-05',
  amount: 15_000,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

export const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  workspaceId: 'ws',
  name: 'Cash',
  type: 'cash',
  currency: 'IDR',
  initialBalance: 0,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

export const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  workspaceId: 'ws',
  parentId: null,
  name: 'Belanja',
  type: 'expense',
  icon: null,
  color: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

export const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  workspaceId: 'ws',
  type: 'expense',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 100_000,
  toAmount: null,
  fee: null,
  occurredAt: now,
  note: null,
  source: 'manual',
  createdBy: null,
  debtId: null,
  debtRole: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

/** An in-memory debt repository that records every write. */
export function createFakeDebtRepository(
  state: {
    debts?: DebtWithCounterparty[];
    installments?: DebtInstallment[];
    payments?: DebtPayment[];
    splitTotal?: number;
  } = {}
) {
  const { debts = [makeDebt()], installments = [], payments = [], splitTotal = 0 } = state;
  const writes: Record<string, unknown[]> = {
    create: [],
    createSplitExpense: [],
    update: [],
    recordPayment: [],
    deletePayment: [],
    softDelete: []
  };
  const listCalls: unknown[] = [];
  const repository: DebtRepository = {
    list: async (_ws, filters) => {
      listCalls.push(filters);
      return debts;
    },
    findById: async (_ws, id) => debts.find((debt) => debt.id === id),
    listInstallments: async (_ws, ids) => installments.filter((row) => ids.includes(row.debtId)),
    listPayments: async (_ws, ids) => payments.filter((row) => ids.includes(row.debtId)),
    sumSplitsForTransaction: async () => splitTotal,
    create: async (creation) => {
      writes.create!.push(creation);
    },
    createSplitExpense: async (creation) => {
      writes.createSplitExpense!.push(creation);
    },
    update: async (_ws, id, update) => {
      writes.update!.push({ id, ...update });
    },
    recordPayment: async (_ws, record) => {
      writes.recordPayment!.push(record);
    },
    deletePayment: async (_ws, payment, patch) => {
      writes.deletePayment!.push({ payment, patch });
    },
    softDelete: async (_ws, id) => {
      writes.softDelete!.push(id);
    }
  };
  return { repository, writes, listCalls };
}

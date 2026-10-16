import type { DebtTransactionRole } from '../constants/debt-transaction-roles';
import type { TransactionType } from '../constants/transaction-types';
import type { TransactionSplitBody } from './debt.types';

export type TransactionDto = {
  id: string;
  type: TransactionType;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amount: number;
  toAmount: number | null;
  fee: number | null;
  occurredAt: string;
  note: string | null;
  debtId: string | null;
  debtRole: DebtTransactionRole | null;
};

export type CreateTransactionBody = {
  type: TransactionType;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  toAmount?: number | null;
  fee?: number | null;
  occurredAt: string;
  note?: string | null;
  /** Expenses only: shares of this expense that other people owe back. */
  splits?: TransactionSplitBody[];
};

export type UpdateTransactionBody = Partial<Omit<CreateTransactionBody, 'splits'>>;

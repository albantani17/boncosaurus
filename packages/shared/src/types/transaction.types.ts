import type { TransactionType } from '../constants/transaction-types';

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
};

export type UpdateTransactionBody = Partial<CreateTransactionBody>;

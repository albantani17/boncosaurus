import { BadRequestError, ConflictError } from '../../errors/app-error';
import type { Transaction, TransactionPatch } from '../../types/finance.types';

export type SplitContext = {
  splitTotal: number;
  /** Currency of the account before and after the patch. */
  currencyBefore: string;
  currencyAfter: string;
};

const LOCKED_ON_DEBT_TRANSACTIONS = [
  'type',
  'accountId',
  'toAccountId',
  'categoryId',
  'amount',
  'toAmount',
  'fee',
  'occurredAt'
] as const satisfies (keyof TransactionPatch)[];

const locked = (message: string) => new ConflictError('DEBT_TRANSACTION_LOCKED', message);

const sameValue = (a: unknown, b: unknown) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

// Edit forms send every field back, so a field only counts as changed when its value differs.
const changesLockedField = (existing: Transaction, patch: TransactionPatch) =>
  LOCKED_ON_DEBT_TRANSACTIONS.some((key) => patch[key] !== undefined && !sameValue(patch[key], existing[key]));

/** Debt transactions are managed from the debt; a split expense must keep room for its shares. */
export function assertTransactionEditable(
  existing: Transaction,
  merged: Pick<Transaction, 'type' | 'amount'>,
  patch: TransactionPatch,
  split: SplitContext
): void {
  if (existing.debtRole !== null) {
    if (changesLockedField(existing, patch)) throw locked('Only the note of a debt transaction can be edited here');
    return;
  }

  if (split.splitTotal === 0) return;
  if (merged.type !== 'expense') throw locked('An expense split with others must stay an expense');
  if (split.currencyBefore !== split.currencyAfter) {
    throw new BadRequestError('CURRENCY_MISMATCH', 'An expense split with others must keep its currency');
  }
  if (merged.amount < split.splitTotal) {
    throw new BadRequestError('DEBT_SPLIT_EXCEEDS_TRANSACTION', 'The amount cannot be less than the shares owed');
  }
}

export function assertTransactionDeletable(existing: Transaction, splitTotal: number): void {
  if (existing.debtRole !== null) throw locked('Delete this from its debt instead');
  if (splitTotal > 0) throw locked('Delete the shares owed on this expense first');
}

import type { DebtDirection } from '@boncosaurus/shared';

type CashFlow = 'income' | 'expense';

/** Borrowing brings money in; lending sends it out. */
export const disbursementTypeOf = (direction: DebtDirection): CashFlow =>
  direction === 'payable' ? 'income' : 'expense';

/** Paying back what I owe sends money out; being paid back brings it in. */
export const repaymentTypeOf = (direction: DebtDirection): CashFlow =>
  direction === 'payable' ? 'expense' : 'income';

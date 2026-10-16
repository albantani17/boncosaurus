import { BadRequestError, ConflictError } from '../../errors/app-error';
import type { Debt } from '../../types/debt.types';
import type { Account, Category } from '../../types/finance.types';
import { repaymentTypeOf } from './debt-transaction-types';

type PaymentReferences = { account: Account; extraCategory?: Category };

export function validateDebtPayment(debt: Pick<Debt, 'status' | 'currency' | 'direction'>, references: PaymentReferences): void {
  if (debt.status !== 'active') throw new ConflictError('DEBT_ALREADY_CLOSED', 'This debt is already closed');

  const { account, extraCategory } = references;
  if (account.isArchived) throw new BadRequestError('ARCHIVED_REFERENCE', 'Account is archived');
  if (account.currency !== debt.currency) {
    throw new BadRequestError('CURRENCY_MISMATCH', 'The account currency must match the debt currency');
  }

  if (!extraCategory) return;
  if (extraCategory.isArchived) throw new BadRequestError('ARCHIVED_REFERENCE', 'Category is archived');
  if (extraCategory.type !== repaymentTypeOf(debt.direction)) {
    throw new BadRequestError('CATEGORY_TYPE_MISMATCH', 'The extra category does not match the payment direction');
  }
}

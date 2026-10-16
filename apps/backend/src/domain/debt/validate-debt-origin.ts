import type { DebtDirection, DebtOrigin } from '@boncosaurus/shared';
import { BadRequestError } from '../../errors/app-error';
import type { Account, Category, Transaction } from '../../types/finance.types';

export type DebtOriginDraft = {
  direction: DebtDirection;
  origin: DebtOrigin;
  principal: number;
  accountId?: string | null;
  categoryId?: string | null;
  originTransactionId?: string | null;
  currency?: string | null;
};

export type DebtOriginReferences = {
  account?: Account;
  category?: Category;
  originTransaction?: { transaction: Transaction; account: Account; splitTotal: number };
};

const invalidOrigin = (message: string) => new BadRequestError('INVALID_DEBT_ORIGIN', message);

export function validateDebtOrigin(draft: DebtOriginDraft, references: DebtOriginReferences): void {
  if (draft.origin === 'cash') return validateCash(draft, references);
  if (draft.origin === 'split') return validateSplit(draft, references);
  return validatePurchase(draft, references);
}

function validateCash(draft: DebtOriginDraft, { account }: DebtOriginReferences): void {
  if (draft.categoryId != null || draft.originTransactionId != null) {
    throw invalidOrigin('A cash debt takes only an account');
  }
  if (!account) throw invalidOrigin('A cash debt needs the account the money moved through');
  if (account.isArchived) throw new BadRequestError('ARCHIVED_REFERENCE', 'Account is archived');
}

function validateSplit(draft: DebtOriginDraft, { originTransaction }: DebtOriginReferences): void {
  if (draft.direction !== 'receivable') throw invalidOrigin('Only receivables can be split from an expense');
  if (draft.accountId != null || draft.categoryId != null) {
    throw invalidOrigin('A split takes only the original transaction');
  }
  if (!originTransaction) throw invalidOrigin('A split needs the expense it comes from');

  const { transaction, splitTotal } = originTransaction;
  if (transaction.type !== 'expense' || transaction.debtRole !== null) {
    throw invalidOrigin('Only a regular expense can be split');
  }
  if (splitTotal + draft.principal > transaction.amount) {
    throw new BadRequestError('DEBT_SPLIT_EXCEEDS_TRANSACTION', 'Splits cannot exceed the expense amount');
  }
}

function validatePurchase(draft: DebtOriginDraft, { category }: DebtOriginReferences): void {
  if (draft.direction !== 'payable') throw invalidOrigin('Only payables can come from a purchase');
  if (draft.accountId != null || draft.originTransactionId != null) {
    throw invalidOrigin('A purchase takes only a category and currency');
  }
  if (!draft.currency) throw invalidOrigin('A purchase needs a currency');
  if (!category) throw invalidOrigin('A purchase needs the category of what was bought');
  if (category.type !== 'expense') {
    throw new BadRequestError('CATEGORY_TYPE_MISMATCH', 'A purchase must use an expense category');
  }
  if (category.isArchived) throw new BadRequestError('ARCHIVED_REFERENCE', 'Category is archived');
}

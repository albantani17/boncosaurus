import { BadRequestError } from '../errors/app-error';
import type { Account, Category, Transaction } from '../types/finance.types';

export type TransactionDraft = Pick<
  Transaction,
  'type' | 'accountId' | 'toAccountId' | 'categoryId' | 'amount' | 'toAmount'
>;

export type TransactionReferences = {
  account: Account;
  toAccount?: Account;
  category?: Category;
};

type ValidationOptions = { allowArchivedIds?: string[] };

export function validateTransaction(
  draft: TransactionDraft,
  references: TransactionReferences,
  { allowArchivedIds = [] }: ValidationOptions = {}
): void {
  const assertActive = (record: Account | Category, label: string) => {
    if (record.isArchived && !allowArchivedIds.includes(record.id)) {
      throw new BadRequestError('ARCHIVED_REFERENCE', `${label} is archived`);
    }
  };

  assertActive(references.account, 'Account');

  if (draft.type === 'transfer') {
    validateTransfer(draft, references, assertActive);
    return;
  }

  if (draft.toAccountId != null || draft.toAmount != null) {
    throw new BadRequestError(
      'INVALID_TRANSFER_FIELDS',
      'toAccountId and toAmount are only allowed on transfers'
    );
  }

  const { category } = references;
  if (!category) return;
  assertActive(category, 'Category');
  if (category.type !== draft.type) {
    throw new BadRequestError('CATEGORY_TYPE_MISMATCH', 'Category type does not match the transaction type');
  }
}

function validateTransfer(
  draft: TransactionDraft,
  { account, toAccount }: TransactionReferences,
  assertActive: (record: Account, label: string) => void
): void {
  if (draft.categoryId != null) {
    throw new BadRequestError('INVALID_TRANSFER_FIELDS', 'Transfers cannot have a category');
  }
  if (!toAccount) {
    throw new BadRequestError('INVALID_TRANSFER_FIELDS', 'Transfers require toAccountId');
  }
  if (toAccount.id === account.id) {
    throw new BadRequestError('INVALID_TRANSFER_FIELDS', 'Cannot transfer to the same account');
  }
  assertActive(toAccount, 'Destination account');

  const isCrossCurrency = toAccount.currency !== account.currency;
  if (isCrossCurrency && draft.toAmount == null) {
    throw new BadRequestError(
      'TO_AMOUNT_REQUIRED',
      'toAmount is required when transferring between different currencies'
    );
  }
  if (!isCrossCurrency && draft.toAmount != null) {
    throw new BadRequestError(
      'INVALID_TRANSFER_FIELDS',
      'toAmount is only allowed for cross-currency transfers'
    );
  }
}

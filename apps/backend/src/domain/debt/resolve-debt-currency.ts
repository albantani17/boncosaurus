import type { DebtOriginDraft, DebtOriginReferences } from './validate-debt-origin';

/** A debt is held in the currency of the money behind it; purchases name theirs. Call after validateDebtOrigin. */
export function resolveDebtCurrency(draft: DebtOriginDraft, references: DebtOriginReferences): string {
  if (draft.origin === 'cash') return references.account!.currency;
  if (draft.origin === 'split') return references.originTransaction!.account.currency;
  return draft.currency!;
}

import type { CounterpartyKind, DebtSourceType } from '@boncosaurus/shared';

/** Only personal debts are with a person; every other source is a product of some company. */
export const defaultCounterpartyKind = (sourceType: DebtSourceType): CounterpartyKind =>
  sourceType === 'personal' ? 'person' : 'institution';

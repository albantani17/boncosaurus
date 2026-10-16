export const COUNTERPARTY_KINDS = ['person', 'institution'] as const;

export type CounterpartyKind = (typeof COUNTERPARTY_KINDS)[number];

import type { CounterpartyKind } from '../constants/counterparty-kinds';

export type CounterpartyDto = {
  id: string;
  name: string;
  kind: CounterpartyKind;
  note: string | null;
  isArchived: boolean;
};

export type CreateCounterpartyBody = {
  name: string;
  kind: CounterpartyKind;
  note?: string | null;
};

export type UpdateCounterpartyBody = Partial<CreateCounterpartyBody> & { isArchived?: boolean };

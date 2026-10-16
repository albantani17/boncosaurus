import {
  COUNTERPARTY_KINDS,
  type Assert,
  type CreateCounterpartyBody,
  type IsMutuallyAssignable,
  type UpdateCounterpartyBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { unionEnum } from './union-enum.schema';

const kind = unionEnum(COUNTERPARTY_KINDS);
const name = t.String({ minLength: 1, maxLength: 100 });
const note = t.Union([t.String({ maxLength: 500 }), t.Null()]);

export const createCounterpartyBody = t.Object({
  name,
  kind,
  note: t.Optional(note)
});

export const updateCounterpartyBody = t.Object({
  name: t.Optional(name),
  kind: t.Optional(kind),
  note: t.Optional(note),
  isArchived: t.Optional(t.Boolean())
});

type _CreateCounterpartyContract = Assert<
  IsMutuallyAssignable<Static<typeof createCounterpartyBody>, CreateCounterpartyBody>
>;
type _UpdateCounterpartyContract = Assert<
  IsMutuallyAssignable<Static<typeof updateCounterpartyBody>, UpdateCounterpartyBody>
>;

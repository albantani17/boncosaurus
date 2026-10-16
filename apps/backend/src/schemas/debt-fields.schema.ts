import { COUNTERPARTY_KINDS } from '@boncosaurus/shared';
import { t } from 'elysia';
import { unionEnum } from './union-enum.schema';

export const uuid = t.String({ format: 'uuid' });
export const nullableUuid = t.Union([uuid, t.Null()]);
export const amount = t.Integer({ minimum: 1 });
export const calendarDate = t.String({ format: 'date' });
export const nullableCalendarDate = t.Union([calendarDate, t.Null()]);
export const nullableNote = t.Union([t.String({ maxLength: 500 }), t.Null()]);
export const debtTitle = t.String({ minLength: 1, maxLength: 120 });

export const counterpartyRef = {
  counterpartyId: t.Optional(nullableUuid),
  counterpartyName: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
  counterpartyKind: t.Optional(t.Union([unionEnum(COUNTERPARTY_KINDS), t.Null()]))
};

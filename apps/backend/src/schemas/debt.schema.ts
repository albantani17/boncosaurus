import {
  DEBT_DIRECTIONS,
  DEBT_ORIGINS,
  DEBT_SOURCE_TYPES,
  DEBT_STATUSES,
  type Assert,
  type CreateDebtBody,
  type IsMutuallyAssignable,
  type Jsonify,
  type UpdateDebtBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { unionEnum } from './union-enum.schema';
import { MAX_INSTALLMENTS } from '../domain/debt/build-installment-schedule';
import {
  amount,
  calendarDate,
  counterpartyRef,
  debtTitle,
  nullableCalendarDate,
  nullableNote,
  nullableUuid,
  uuid
} from './debt-fields.schema';

const sourceType = unionEnum(DEBT_SOURCE_TYPES);
const reminderDays = t.Integer({ minimum: 0, maximum: 60 });

const schedule = t.Union([
  t.Object({
    firstDueDate: calendarDate,
    count: t.Integer({ minimum: 1, maximum: MAX_INSTALLMENTS }),
    installmentAmount: t.Optional(t.Union([amount, t.Null()]))
  }),
  t.Null()
]);

export const createDebtBody = t.Object({
  ...counterpartyRef,
  direction: unionEnum(DEBT_DIRECTIONS),
  sourceType,
  origin: unionEnum(DEBT_ORIGINS),
  title: debtTitle,
  principal: amount,
  originatedAt: t.Date(),
  dueDate: t.Optional(nullableCalendarDate),
  note: t.Optional(nullableNote),
  accountId: t.Optional(nullableUuid),
  categoryId: t.Optional(nullableUuid),
  currency: t.Optional(t.Union([t.String({ pattern: '^[A-Z]{3}$' }), t.Null()])),
  originTransactionId: t.Optional(nullableUuid),
  schedule: t.Optional(schedule),
  reminderDays: t.Optional(t.Union([reminderDays, t.Null()]))
});

export const updateDebtBody = t.Object({
  title: t.Optional(debtTitle),
  sourceType: t.Optional(sourceType),
  counterpartyId: t.Optional(uuid),
  principal: t.Optional(amount),
  dueDate: t.Optional(nullableCalendarDate),
  note: t.Optional(nullableNote),
  schedule: t.Optional(schedule),
  reminderDays: t.Optional(reminderDays)
});

export const listDebtsQuery = t.Object({
  direction: t.Optional(unionEnum(DEBT_DIRECTIONS)),
  status: t.Optional(unionEnum(DEBT_STATUSES)),
  counterpartyId: t.Optional(uuid)
});

type _CreateDebtContract = Assert<IsMutuallyAssignable<Jsonify<Static<typeof createDebtBody>>, CreateDebtBody>>;
type _UpdateDebtContract = Assert<IsMutuallyAssignable<Static<typeof updateDebtBody>, UpdateDebtBody>>;

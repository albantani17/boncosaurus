import {
  TRANSACTION_TYPES,
  type Assert,
  type CreateTransactionBody,
  type IsMutuallyAssignable,
  type Jsonify,
  type UpdateTransactionBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { unionEnum } from './union-enum.schema';
import { counterpartyRef, debtTitle, nullableCalendarDate } from './debt-fields.schema';

const transactionType = unionEnum(TRANSACTION_TYPES);
const uuid = t.String({ format: 'uuid' });
const nullableUuid = t.Union([uuid, t.Null()]);
const amount = t.Integer({ minimum: 1 });
const nullableAmount = t.Union([amount, t.Null()]);
const note = t.Union([t.String({ maxLength: 500 }), t.Null()]);
const MAX_SPLITS = 20;

const split = t.Object({
  ...counterpartyRef,
  amount,
  title: t.Optional(t.Union([debtTitle, t.Null()])),
  dueDate: t.Optional(nullableCalendarDate)
});

export const createTransactionBody = t.Object({
  type: transactionType,
  accountId: uuid,
  toAccountId: t.Optional(nullableUuid),
  categoryId: t.Optional(nullableUuid),
  amount,
  toAmount: t.Optional(nullableAmount),
  fee: t.Optional(nullableAmount),
  occurredAt: t.Date(),
  note: t.Optional(note),
  splits: t.Optional(t.Array(split, { maxItems: MAX_SPLITS }))
});

export const updateTransactionBody = t.Object({
  type: t.Optional(transactionType),
  accountId: t.Optional(uuid),
  toAccountId: t.Optional(nullableUuid),
  categoryId: t.Optional(nullableUuid),
  amount: t.Optional(amount),
  toAmount: t.Optional(nullableAmount),
  fee: t.Optional(nullableAmount),
  occurredAt: t.Optional(t.Date()),
  note: t.Optional(note)
});

export const listTransactionsQuery = t.Object({
  accountId: t.Optional(uuid),
  categoryId: t.Optional(uuid),
  type: t.Optional(transactionType),
  from: t.Optional(t.Date()),
  to: t.Optional(t.Date()),
  limit: t.Numeric({ minimum: 1, maximum: 200, default: 50 }),
  offset: t.Numeric({ minimum: 0, default: 0 })
});

type _CreateTransactionContract = Assert<
  IsMutuallyAssignable<Jsonify<Static<typeof createTransactionBody>>, CreateTransactionBody>
>;
type _UpdateTransactionContract = Assert<
  IsMutuallyAssignable<Jsonify<Static<typeof updateTransactionBody>>, UpdateTransactionBody>
>;

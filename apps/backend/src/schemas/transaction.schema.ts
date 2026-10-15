import { t } from 'elysia';

const transactionType = t.Union([t.Literal('income'), t.Literal('expense'), t.Literal('transfer')]);
const uuid = t.String({ format: 'uuid' });
const nullableUuid = t.Union([uuid, t.Null()]);
const amount = t.Integer({ minimum: 1 });
const nullableAmount = t.Union([amount, t.Null()]);
const note = t.Union([t.String({ maxLength: 500 }), t.Null()]);

export const createTransactionBody = t.Object({
  type: transactionType,
  accountId: uuid,
  toAccountId: t.Optional(nullableUuid),
  categoryId: t.Optional(nullableUuid),
  amount,
  toAmount: t.Optional(nullableAmount),
  fee: t.Optional(nullableAmount),
  occurredAt: t.Date(),
  note: t.Optional(note)
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

import { t } from 'elysia';

const accountType = t.Union([
  t.Literal('cash'),
  t.Literal('bank'),
  t.Literal('ewallet'),
  t.Literal('credit_card'),
  t.Literal('investment'),
  t.Literal('other')
]);
const currency = t.String({ pattern: '^[A-Z]{3}$' });
const name = t.String({ minLength: 1, maxLength: 100 });

export const createAccountBody = t.Object({
  name,
  type: accountType,
  currency,
  initialBalance: t.Optional(t.Integer()),
  sortOrder: t.Optional(t.Integer())
});

export const updateAccountBody = t.Object({
  name: t.Optional(name),
  type: t.Optional(accountType),
  currency: t.Optional(currency),
  initialBalance: t.Optional(t.Integer()),
  isArchived: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Integer())
});

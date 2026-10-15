import {
  ACCOUNT_TYPES,
  type Assert,
  type CreateAccountBody,
  type IsMutuallyAssignable,
  type UpdateAccountBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';

const accountType = t.UnionEnum(ACCOUNT_TYPES);
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

type _CreateAccountContract = Assert<IsMutuallyAssignable<Static<typeof createAccountBody>, CreateAccountBody>>;
type _UpdateAccountContract = Assert<IsMutuallyAssignable<Static<typeof updateAccountBody>, UpdateAccountBody>>;

import {
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
  type Assert,
  type ImportCommitPayload,
  type IsMutuallyAssignable
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { unionEnum } from './union-enum.schema';

const transactionType = unionEnum(CATEGORY_TYPES);
const accountType = unionEnum(ACCOUNT_TYPES);
const uuid = t.String({ format: 'uuid' });
const name = t.String({ minLength: 1, maxLength: 100 });

export const previewImportBody = t.Object({
  file: t.File(),
  timeZone: t.Optional(t.String({ maxLength: 64 })),
  utcOffsetMinutes: t.Optional(t.Numeric({ minimum: -840, maximum: 840 }))
});

export const commitImportBody = t.Object({
  accounts: t.Array(
    t.Object({
      name,
      accountId: t.Union([uuid, t.Null()]),
      type: accountType,
      currency: t.String({ pattern: '^[A-Z]{3}$' })
    }),
    { maxItems: 200 }
  ),
  categories: t.Array(
    t.Object({ name, categoryId: t.Union([uuid, t.Null()]), type: transactionType }),
    { maxItems: 500 }
  ),
  rows: t.Array(
    t.Object({
      occurredAt: t.String({ maxLength: 40 }),
      type: transactionType,
      amount: t.Integer({ minimum: 1 }),
      accountName: name,
      categoryName: t.Union([name, t.Null()]),
      note: t.String({ maxLength: 500 })
    }),
    { maxItems: 2000 }
  )
});

type _CommitImportContract = Assert<IsMutuallyAssignable<Static<typeof commitImportBody>, ImportCommitPayload>>;

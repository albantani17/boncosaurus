import { type Assert, type CreateDebtPaymentBody, type IsMutuallyAssignable, type Jsonify } from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { amount, nullableNote, nullableUuid, uuid } from './debt-fields.schema';

export const createDebtPaymentBody = t.Object({
  accountId: uuid,
  amount,
  paidAt: t.Date(),
  extraCategoryId: t.Optional(nullableUuid),
  note: t.Optional(nullableNote)
});

export const debtPaymentParams = t.Object({ id: uuid, paymentId: uuid });

type _CreateDebtPaymentContract = Assert<
  IsMutuallyAssignable<Jsonify<Static<typeof createDebtPaymentBody>>, CreateDebtPaymentBody>
>;

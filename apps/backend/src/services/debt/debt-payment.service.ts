import type { CreateDebtPaymentBody } from '@boncosaurus/shared';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import type { AccountRepository } from '../../repositories/account.repository';
import type { CategoryRepository } from '../../repositories/category.repository';
import type { DebtRepository } from '../../repositories/debt.repository';
import type { NewDebtPayment } from '../../types/debt.types';
import type { NewTransaction } from '../../types/finance.types';
import type { DebtDetail } from '../../domain/debt/build-debt-view';
import { repaymentTypeOf } from '../../domain/debt/debt-transaction-types';
import { resolveSettlement } from '../../domain/debt/resolve-settlement';
import { splitPayment } from '../../domain/debt/split-payment';
import { validateDebtPayment } from '../../domain/debt/validate-debt-payment';
import type { DebtService } from './debt.service';

export type RecordPaymentInput = Omit<CreateDebtPaymentBody, 'paidAt'> & { paidAt: Date; createdBy?: string };
export type PaymentPreview = { debt: DebtDetail; principalAmount: number; extraAmount: number };
export type WriteOffPreview = { debt: DebtDetail; amount: number };

type Dependencies = {
  debts: Pick<DebtRepository, 'recordPayment' | 'deletePayment' | 'update'>;
  debtService: Pick<DebtService, 'getDebt'>;
  accounts: Pick<AccountRepository, 'findById'>;
  categories: Pick<CategoryRepository, 'findById'>;
  generateId: () => string;
  now: () => Date;
};

export function createDebtPaymentService({ debts, debtService, accounts, categories, generateId, now }: Dependencies) {
  async function loadPaymentReferences(workspaceId: string, input: RecordPaymentInput) {
    const account = await accounts.findById(workspaceId, input.accountId);
    if (!account) throw new NotFoundError('Account');
    const extraCategory = input.extraCategoryId ? await categories.findById(workspaceId, input.extraCategoryId) : undefined;
    if (input.extraCategoryId && !extraCategory) throw new NotFoundError('Category');
    return { account, extraCategory };
  }

  function buildPaymentTransactions(debt: DebtDetail, payment: NewDebtPayment, input: RecordPaymentInput) {
    const base = {
      workspaceId: debt.workspaceId,
      type: repaymentTypeOf(debt.direction),
      accountId: input.accountId,
      occurredAt: input.paidAt,
      note: input.note ?? debt.title,
      debtId: debt.id,
      createdBy: input.createdBy
    } satisfies Partial<NewTransaction>;
    const rows: NewTransaction[] = [];
    if (payment.repaymentTransactionId) {
      rows.push({ ...base, id: payment.repaymentTransactionId, amount: payment.principalAmount, debtRole: 'principal' });
    }
    if (payment.chargeTransactionId) {
      rows.push({
        ...base,
        id: payment.chargeTransactionId,
        amount: payment.extraAmount,
        categoryId: input.extraCategoryId ?? null,
        debtRole: 'charge'
      });
    }
    return rows;
  }

  async function planPayment(workspaceId: string, debtId: string, input: RecordPaymentInput) {
    const debt = await debtService.getDebt(workspaceId, debtId);
    validateDebtPayment(debt, await loadPaymentReferences(workspaceId, input));
    return { debt, ...splitPayment(input.amount, debt.position.principalRemaining) };
  }

  async function requireOpenDebt(workspaceId: string, debtId: string) {
    const debt = await debtService.getDebt(workspaceId, debtId);
    if (debt.status !== 'active') throw new ConflictError('DEBT_ALREADY_CLOSED', 'This debt is already closed');
    return debt;
  }

  return {
    /** Validates a payment and shows how it splits into principal and extra, without saving it. */
    previewPayment: (workspaceId: string, debtId: string, input: RecordPaymentInput): Promise<PaymentPreview> =>
      planPayment(workspaceId, debtId, input),

    async recordPayment(workspaceId: string, debtId: string, input: RecordPaymentInput): Promise<DebtDetail> {
      const { debt, principalAmount, extraAmount } = await planPayment(workspaceId, debtId, input);
      const payment: NewDebtPayment = {
        id: generateId(),
        workspaceId,
        debtId,
        accountId: input.accountId,
        paidAt: input.paidAt,
        amount: input.amount,
        principalAmount,
        extraAmount,
        repaymentTransactionId: principalAmount > 0 ? generateId() : null,
        chargeTransactionId: extraAmount > 0 ? generateId() : null,
        note: input.note ?? null
      };
      const payments = [...debt.payments, { amount: input.amount, principalAmount, paidAt: input.paidAt }];

      await debts.recordPayment(workspaceId, {
        payment,
        transactions: buildPaymentTransactions(debt, payment, input),
        debtPatch: resolveSettlement(debt, debt.installments, payments)
      });
      return debtService.getDebt(workspaceId, debtId);
    },

    async deletePayment(workspaceId: string, debtId: string, paymentId: string): Promise<DebtDetail> {
      const debt = await debtService.getDebt(workspaceId, debtId);
      const payment = debt.payments.find((row) => row.id === paymentId);
      if (!payment) throw new NotFoundError('Payment');
      if (debt.status === 'written_off') {
        throw new ConflictError('DEBT_ALREADY_CLOSED', 'Payments of a written-off debt cannot be removed');
      }

      const remaining = debt.payments.filter((row) => row.id !== paymentId);
      await debts.deletePayment(workspaceId, payment, resolveSettlement(debt, debt.installments, remaining));
      return debtService.getDebt(workspaceId, debtId);
    },

    /** What a write-off would give up, checked like writeOff but without saving it. */
    async previewWriteOff(workspaceId: string, debtId: string): Promise<WriteOffPreview> {
      const debt = await requireOpenDebt(workspaceId, debtId);
      return { debt, amount: debt.position.principalRemaining };
    },

    /** Gives up on what is left; the unpaid principal shows up in reports on this day. */
    async writeOff(workspaceId: string, debtId: string): Promise<DebtDetail> {
      const { principalRemaining } = (await requireOpenDebt(workspaceId, debtId)).position;
      await debts.update(workspaceId, debtId, {
        patch: { status: 'written_off', closedAt: now(), writtenOffAmount: principalRemaining > 0 ? principalRemaining : null }
      });
      return debtService.getDebt(workspaceId, debtId);
    }
  };
}

export type DebtPaymentService = ReturnType<typeof createDebtPaymentService>;

import {
  DEBT_DIRECTIONS,
  DEBT_SOURCE_TYPES,
  DEBT_STATUSES,
  type DebtPaymentProposal,
  type DebtProposal,
  type DebtProposalDraft,
  type DebtWriteOffProposal
} from '@boncosaurus/shared';
import { tool } from 'ai';
import { z } from 'zod';
import type { DebtDetail, DebtView } from '../../domain/debt/build-debt-view';
import { parseToolDate } from '../../domain/chat/parse-tool-date';
import type { DebtPaymentService } from '../debt/debt-payment.service';
import type { DebtService } from '../debt/debt.service';
import { toInvalidProposal } from './to-invalid-proposal';

export type DebtChatToolDependencies = {
  debts: Pick<DebtService, 'listDebts' | 'getDebt' | 'getSummary' | 'previewDebt'>;
  debtPayments: Pick<DebtPaymentService, 'previewPayment' | 'previewWriteOff'>;
};

export const PROPOSE_DEBT_TOOL = 'proposeDebt';
export const PROPOSE_DEBT_PAYMENT_TOOL = 'proposeDebtPayment';
export const PROPOSE_DEBT_WRITE_OFF_TOOL = 'proposeDebtWriteOff';

const DATE_HINT = 'ISO 8601 datetime with offset, e.g. 2026-10-01T09:00:00+07:00';
const CALENDAR_DATE_HINT = 'Calendar date YYYY-MM-DD';

const isoDate = z.string().describe(DATE_HINT);
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe(CALENDAR_DATE_HINT);
const amount = z.number().int().positive().describe('Whole units of the currency, no decimals');
const invalidDate = (field: string) => ({
  status: 'invalid' as const,
  code: 'INVALID_DATE',
  message: `${field} must be an ${DATE_HINT}`
});

const toDebtRow = (debt: DebtView) => ({
  id: debt.id,
  direction: debt.direction,
  title: debt.title,
  counterparty: debt.counterpartyName,
  source: debt.sourceType,
  status: debt.status,
  currency: debt.currency,
  principal: debt.principal,
  paid: debt.position.paid,
  remaining: debt.position.remaining,
  nextDueDate: debt.position.nextDueDate,
  nextDueAmount: debt.position.nextDueAmount,
  isOverdue: debt.position.isOverdue,
  installmentCount: debt.installmentCount,
  originatedAt: debt.originatedAt.toISOString()
});

const toDebtDetail = (debt: DebtDetail) => ({
  ...toDebtRow(debt),
  principalRemaining: debt.position.principalRemaining,
  totalDue: debt.position.totalDue,
  note: debt.note,
  installments: debt.installments.map(({ sequence, dueDate, amount, paidAmount, status }) => ({
    sequence,
    dueDate,
    amount,
    paidAmount,
    status
  })),
  payments: debt.payments.map(({ paidAt, amount, principalAmount, extraAmount, note }) => ({
    paidAt: paidAt.toISOString(),
    amount,
    principalAmount,
    extraAmount,
    note
  }))
});

const describeDebt = (debt: DebtDetail) => ({
  debtId: debt.id,
  debtTitle: debt.title,
  counterpartyName: debt.counterpartyName,
  direction: debt.direction,
  currency: debt.currency
});

export function createDebtChatTools(deps: DebtChatToolDependencies, workspaceId: string) {
  return {
    listDebts: tool({
      description:
        'Debts (payable: the user owes) and receivables (receivable: others owe the user), newest first, ' +
        'with what remains and the next due date. Defaults to active ones.',
      inputSchema: z.object({
        direction: z.enum(DEBT_DIRECTIONS).optional(),
        status: z.enum(DEBT_STATUSES).optional().describe('Defaults to active'),
        counterparty: z.string().optional().describe('Part of a person or provider name')
      }),
      execute: async ({ direction, status, counterparty }) => {
        const debts = await deps.debts.listDebts(workspaceId, { direction, status: status ?? 'active' });
        const needle = counterparty?.trim().toLowerCase();
        return debts
          .filter((debt) => !needle || debt.counterpartyName.toLowerCase().includes(needle))
          .map(toDebtRow);
      }
    }),

    getDebtSummary: tool({
      description: 'What remains on all active debts and receivables, per currency, and how many are overdue.',
      inputSchema: z.object({}),
      execute: () => deps.debts.getSummary(workspaceId)
    }),

    getDebt: tool({
      description: 'One debt with its installment schedule and payment history.',
      inputSchema: z.object({ debtId: z.string() }),
      execute: async ({ debtId }) => {
        try {
          return toDebtDetail(await deps.debts.getDebt(workspaceId, debtId));
        } catch (error) {
          return toInvalidProposal(error);
        }
      }
    }),

    [PROPOSE_DEBT_TOOL]: tool({
      description:
        'Prepare a new debt or receivable for the user to confirm; nothing is saved until they confirm. ' +
        'origin "cash": money moved through accountId (lending sends it out, borrowing brings it in). ' +
        'origin "purchase": payables only, nothing moved yet (paylater, card, a friend paid); needs an expense categoryId and currency. ' +
        'For a share of an expense the user paid for others, use proposeTransaction with splits instead.',
      inputSchema: z.object({
        direction: z.enum(DEBT_DIRECTIONS),
        sourceType: z.enum(DEBT_SOURCE_TYPES),
        origin: z.enum(['cash', 'purchase']),
        counterpartyName: z.string().min(1).max(100).describe('Person or provider, e.g. "Hani" or "Shopee PayLater"'),
        title: z.string().min(1).max(120).describe('What it is for'),
        principal: amount,
        originatedAt: isoDate,
        dueDate: calendarDate.nullish().describe('Single due date when there is no schedule'),
        accountId: z.string().nullish().describe('Required when origin is "cash": the account id the money moved through'),
        categoryId: z.string().nullish().describe('Required when origin is "purchase": an expense category id'),
        currency: z.string().length(3).nullish().describe('Required when origin is "purchase", e.g. IDR'),
        schedule: z
          .object({
            firstDueDate: calendarDate,
            count: z.number().int().min(1).max(120),
            installmentAmount: amount.nullish().describe('Per installment, interest included; omit to split evenly')
          })
          .nullish(),
        reminderDays: z.number().int().min(0).max(60).nullish().describe('Days before a due date to remind'),
        note: z.string().max(500).nullish()
      }),
      execute: async (input): Promise<DebtProposal> => {
        const originatedAt = parseToolDate(input.originatedAt);
        if (!originatedAt) return invalidDate('originatedAt');

        const draft: DebtProposalDraft = {
          direction: input.direction,
          sourceType: input.sourceType,
          origin: input.origin,
          counterpartyName: input.counterpartyName.trim(),
          title: input.title.trim(),
          principal: input.principal,
          originatedAt: originatedAt.toISOString(),
          dueDate: input.dueDate ?? null,
          accountId: input.accountId ?? null,
          categoryId: input.categoryId ?? null,
          currency: input.currency?.toUpperCase() ?? null,
          schedule: input.schedule
            ? { ...input.schedule, installmentAmount: input.schedule.installmentAmount ?? null }
            : null,
          reminderDays: input.reminderDays ?? null,
          note: input.note?.trim() || null
        };
        try {
          await deps.debts.previewDebt(workspaceId, { ...draft, originatedAt });
        } catch (error) {
          return toInvalidProposal(error);
        }
        return { status: 'pending', draft };
      }
    }),

    [PROPOSE_DEBT_PAYMENT_TOOL]: tool({
      description:
        'Prepare a payment on an existing debt or receivable (find debtId with listDebts first) for the user to confirm. ' +
        'Partial payments are fine; anything above the remaining principal is recorded as interest, fee or tip ' +
        '(extraCategoryId: an expense category for payables, an income category for receivables).',
      inputSchema: z.object({
        debtId: z.string(),
        accountId: z.string().describe('Account the money left (payable) or arrived in (receivable)'),
        amount,
        paidAt: isoDate,
        extraCategoryId: z.string().nullish(),
        note: z.string().max(500).nullish()
      }),
      execute: async (input): Promise<DebtPaymentProposal> => {
        const paidAt = parseToolDate(input.paidAt);
        if (!paidAt) return invalidDate('paidAt');

        const payment = {
          accountId: input.accountId,
          amount: input.amount,
          extraCategoryId: input.extraCategoryId ?? null,
          note: input.note?.trim() || null
        };
        try {
          const preview = await deps.debtPayments.previewPayment(workspaceId, input.debtId, { ...payment, paidAt });
          return {
            status: 'pending',
            draft: {
              ...payment,
              paidAt: paidAt.toISOString(),
              ...describeDebt(preview.debt),
              principalAmount: preview.principalAmount,
              extraAmount: preview.extraAmount
            }
          };
        } catch (error) {
          return toInvalidProposal(error);
        }
      }
    }),

    [PROPOSE_DEBT_WRITE_OFF_TOOL]: tool({
      description:
        'Prepare writing off what is left of a debt or receivable (it will never be paid) for the user to confirm.',
      inputSchema: z.object({ debtId: z.string() }),
      execute: async ({ debtId }): Promise<DebtWriteOffProposal> => {
        try {
          const preview = await deps.debtPayments.previewWriteOff(workspaceId, debtId);
          return { status: 'pending', draft: { ...describeDebt(preview.debt), amount: preview.amount } };
        } catch (error) {
          return toInvalidProposal(error);
        }
      }
    })
  };
}

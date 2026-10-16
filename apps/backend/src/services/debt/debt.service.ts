import type { CreateDebtBody, DebtSummaryDto, UpdateDebtBody } from '@boncosaurus/shared';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/app-error';
import type { AccountRepository } from '../../repositories/account.repository';
import type { CategoryRepository } from '../../repositories/category.repository';
import type { DebtCreation, DebtRepository, DebtUpdate } from '../../repositories/debt.repository';
import type { TransactionRepository } from '../../repositories/transaction.repository';
import type { DebtFilters, DebtWithCounterparty, NewDebtInstallment } from '../../types/debt.types';
import type { NewTransaction } from '../../types/finance.types';
import { buildDebtDetail, buildDebtView, type DebtDetail, type DebtView } from '../../domain/debt/build-debt-view';
import { buildInstallmentSchedule } from '../../domain/debt/build-installment-schedule';
import { defaultCounterpartyKind } from '../../domain/debt/default-counterparty-kind';
import { defaultReminderDays } from '../../domain/debt/default-reminder-days';
import { disbursementTypeOf } from '../../domain/debt/debt-transaction-types';
import { resolveDebtCurrency } from '../../domain/debt/resolve-debt-currency';
import { resolveSettlement } from '../../domain/debt/resolve-settlement';
import { type DebtReminder, selectDueReminders } from '../../domain/debt/select-due-reminders';
import { summarizeDebts } from '../../domain/debt/summarize-debts';
import {
  type DebtOriginDraft,
  type DebtOriginReferences,
  validateDebtOrigin
} from '../../domain/debt/validate-debt-origin';
import { toCalendarDate } from '../../utils/to-calendar-date';
import type { CounterpartyService } from '../counterparty/counterparty.service';

export type CreateDebtInput = Omit<CreateDebtBody, 'originatedAt'> & { originatedAt: Date; createdBy?: string };
export type UpdateDebtInput = UpdateDebtBody;

type Dependencies = {
  debts: DebtRepository;
  counterparties: Pick<CounterpartyService, 'resolveCounterparty'>;
  accounts: Pick<AccountRepository, 'findById'>;
  categories: Pick<CategoryRepository, 'findById'>;
  transactions: Pick<TransactionRepository, 'findById'>;
  generateId: () => string;
  now: () => Date;
};

export function createDebtService(deps: Dependencies) {
  const { debts, accounts, categories, transactions, generateId, now } = deps;
  const today = () => toCalendarDate(now());

  async function requireDebt(workspaceId: string, id: string): Promise<DebtWithCounterparty> {
    const debt = await debts.findById(workspaceId, id);
    if (!debt) throw new NotFoundError('Debt');
    return debt;
  }

  async function loadDetail(workspaceId: string, debt: DebtWithCounterparty): Promise<DebtDetail> {
    const [installments, payments] = await Promise.all([
      debts.listInstallments(workspaceId, [debt.id]),
      debts.listPayments(workspaceId, [debt.id])
    ]);
    return buildDebtDetail(debt, installments, payments, today());
  }

  async function loadOriginReferences(workspaceId: string, draft: DebtOriginDraft): Promise<DebtOriginReferences> {
    const account = draft.accountId ? await accounts.findById(workspaceId, draft.accountId) : undefined;
    if (draft.accountId && !account) throw new NotFoundError('Account');

    const category = draft.categoryId ? await categories.findById(workspaceId, draft.categoryId) : undefined;
    if (draft.categoryId && !category) throw new NotFoundError('Category');

    if (!draft.originTransactionId) return { account, category };
    const transaction = await transactions.findById(workspaceId, draft.originTransactionId);
    if (!transaction) throw new NotFoundError('Transaction');
    const [transactionAccount, splitTotal] = await Promise.all([
      accounts.findById(workspaceId, transaction.accountId),
      debts.sumSplitsForTransaction(workspaceId, transaction.id)
    ]);
    return { account, category, originTransaction: { transaction, account: transactionAccount!, splitTotal } };
  }

  const toInstallmentRows = (workspaceId: string, debtId: string, drafts: ReturnType<typeof buildInstallmentSchedule>) =>
    drafts.map((draft): NewDebtInstallment => ({ ...draft, id: generateId(), workspaceId, debtId }));

  async function planDebt(workspaceId: string, input: CreateDebtInput): Promise<DebtCreation> {
    const counterparty = await deps.counterparties.resolveCounterparty(
      workspaceId,
      input,
      defaultCounterpartyKind(input.sourceType)
    );
    const references = await loadOriginReferences(workspaceId, input);
    validateDebtOrigin(input, references);

    const debtId = generateId();
    const schedule = input.schedule ? buildInstallmentSchedule(input.schedule, input.principal) : [];
    const title = input.title.trim();
    const disbursement: (NewTransaction & { id: string }) | undefined =
      input.origin === 'cash'
        ? {
            id: generateId(),
            workspaceId,
            type: disbursementTypeOf(input.direction),
            accountId: input.accountId!,
            amount: input.principal,
            occurredAt: input.originatedAt,
            note: title,
            createdBy: input.createdBy
          }
        : undefined;

    return {
      counterparty: counterparty.created,
      debt: {
        id: debtId,
        workspaceId,
        direction: input.direction,
        sourceType: input.sourceType,
        origin: input.origin,
        counterpartyId: counterparty.id,
        title,
        currency: resolveDebtCurrency(input, references),
        principal: input.principal,
        originatedAt: input.originatedAt,
        dueDate: schedule.at(-1)?.dueDate ?? input.dueDate ?? null,
        reminderDays: input.reminderDays ?? defaultReminderDays(input.sourceType),
        note: input.note ?? null,
        categoryId: input.categoryId ?? null,
        originTransactionId: input.originTransactionId ?? null,
        disbursementTransactionId: disbursement?.id ?? null,
        createdBy: input.createdBy
      },
      disbursement,
      installments: toInstallmentRows(workspaceId, debtId, schedule)
    };
  }

  async function listDebts(workspaceId: string, filters: DebtFilters): Promise<DebtView[]> {
    const rows = await debts.list(workspaceId, filters);
    const ids = rows.map((row) => row.id);
    const [installments, payments] = await Promise.all([
      debts.listInstallments(workspaceId, ids),
      debts.listPayments(workspaceId, ids)
    ]);
    const date = today();
    return rows.map((row) =>
      buildDebtView(
        row,
        installments.filter((installment) => installment.debtId === row.id),
        payments.filter((payment) => payment.debtId === row.id),
        date
      )
    );
  }

  async function getDebt(workspaceId: string, id: string): Promise<DebtDetail> {
    return loadDetail(workspaceId, await requireDebt(workspaceId, id));
  }

  return {
    listDebts,
    getDebt,

    async getSummary(workspaceId: string): Promise<DebtSummaryDto> {
      return summarizeDebts(await listDebts(workspaceId, { status: 'active' }));
    },

    /** Validates a new debt exactly like createDebt, without saving it. */
    async previewDebt(workspaceId: string, input: CreateDebtInput): Promise<void> {
      await planDebt(workspaceId, input);
    },

    async listReminders(workspaceId: string): Promise<DebtReminder[]> {
      return selectDueReminders(await listDebts(workspaceId, { status: 'active' }), today());
    },

    async createDebt(workspaceId: string, input: CreateDebtInput): Promise<DebtDetail> {
      const creation = await planDebt(workspaceId, input);
      await debts.create(creation);
      return getDebt(workspaceId, creation.debt.id);
    },

    async updateDebt(workspaceId: string, id: string, input: UpdateDebtInput): Promise<DebtDetail> {
      const current = await getDebt(workspaceId, id);
      const { schedule, principal: newPrincipal, ...fields } = input;
      const principal = newPrincipal ?? current.principal;
      const isChangingPrincipal = principal !== current.principal;

      if (isChangingPrincipal && current.payments.length > 0) {
        throw new ConflictError('DEBT_HAS_PAYMENTS', 'The principal cannot change once payments are recorded');
      }
      if (isChangingPrincipal && current.origin === 'split') {
        await assertSplitFits(workspaceId, current, principal);
      }
      if (isChangingPrincipal && current.installmentCount > 0 && schedule === undefined) {
        throw new BadRequestError('INVALID_SCHEDULE', 'Send the schedule again when the principal changes');
      }
      if (fields.counterpartyId) {
        await deps.counterparties.resolveCounterparty(workspaceId, { counterpartyId: fields.counterpartyId }, 'person');
      }

      const scheduleDrafts = schedule ? buildInstallmentSchedule(schedule, principal) : schedule === null ? [] : undefined;
      const installmentsAfter = scheduleDrafts ?? current.installments;
      const update: DebtUpdate = {
        patch: {
          ...fields,
          title: fields.title?.trim(),
          principal,
          dueDate: scheduleDrafts?.length ? scheduleDrafts.at(-1)!.dueDate : fields.dueDate,
          ...resolveSettlement({ ...current, principal }, installmentsAfter, current.payments)
        },
        installments: scheduleDrafts && toInstallmentRows(workspaceId, id, scheduleDrafts),
        disbursementAmount: isChangingPrincipal ? principal : undefined
      };
      await debts.update(workspaceId, id, update);
      return getDebt(workspaceId, id);
    },

    async deleteDebt(workspaceId: string, id: string): Promise<void> {
      await requireDebt(workspaceId, id);
      await debts.softDelete(workspaceId, id);
    }
  };

  async function assertSplitFits(workspaceId: string, debt: DebtWithCounterparty, principal: number) {
    const transaction = await transactions.findById(workspaceId, debt.originTransactionId!);
    const otherSplits = (await debts.sumSplitsForTransaction(workspaceId, debt.originTransactionId!)) - debt.principal;
    if (transaction && otherSplits + principal > transaction.amount) {
      throw new BadRequestError('DEBT_SPLIT_EXCEEDS_TRANSACTION', 'Splits cannot exceed the expense amount');
    }
  }
}

export type DebtService = ReturnType<typeof createDebtService>;

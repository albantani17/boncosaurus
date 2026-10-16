import type { counterparties, debtInstallments, debtPayments, debts } from '../db/schema';

export type {
  CounterpartyDto,
  DebtDetailDto,
  DebtDto,
  DebtSummaryDto,
  InstallmentStatus
} from '@boncosaurus/shared';

export type Counterparty = typeof counterparties.$inferSelect;
export type NewCounterparty = typeof counterparties.$inferInsert;
export type CounterpartyPatch = Partial<Pick<NewCounterparty, 'name' | 'kind' | 'note' | 'isArchived'>>;

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type DebtPatch = Partial<
  Pick<
    NewDebt,
    | 'title'
    | 'sourceType'
    | 'counterpartyId'
    | 'principal'
    | 'dueDate'
    | 'reminderDays'
    | 'note'
    | 'status'
    | 'closedAt'
    | 'writtenOffAmount'
  >
>;

export type DebtInstallment = typeof debtInstallments.$inferSelect;
export type NewDebtInstallment = typeof debtInstallments.$inferInsert;

export type DebtPayment = typeof debtPayments.$inferSelect;
export type NewDebtPayment = typeof debtPayments.$inferInsert;

export type DebtWithCounterparty = Debt & {
  counterpartyName: string;
  counterpartyKind: Counterparty['kind'];
  accountId: string | null;
};

export type DebtFilters = {
  direction?: Debt['direction'];
  status?: Debt['status'];
  counterpartyId?: string;
};

/** A due date and amount, before it gets ids and a debt. */
export type InstallmentDraft = { sequence: number; dueDate: string; amount: number };

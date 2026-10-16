import type { CounterpartyKind } from '../constants/counterparty-kinds';
import type { DebtDirection } from '../constants/debt-directions';
import type { DebtOrigin } from '../constants/debt-origins';
import type { DebtSourceType } from '../constants/debt-source-types';
import type { DebtStatus } from '../constants/debt-statuses';
import type { InstallmentStatus } from '../constants/installment-statuses';

/** `YYYY-MM-DD`, a calendar day without a time zone. */
export type CalendarDate = string;

export type DebtPositionDto = {
  totalDue: number;
  paid: number;
  remaining: number;
  principalRemaining: number;
  nextDueDate: CalendarDate | null;
  /** What is due on `nextDueDate`: the open installment, or everything left without a schedule. */
  nextDueAmount: number | null;
  isOverdue: boolean;
};

export type DebtDto = {
  id: string;
  direction: DebtDirection;
  sourceType: DebtSourceType;
  origin: DebtOrigin;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyKind: CounterpartyKind;
  title: string;
  currency: string;
  principal: number;
  originatedAt: string;
  dueDate: CalendarDate | null;
  status: DebtStatus;
  closedAt: string | null;
  writtenOffAmount: number | null;
  note: string | null;
  accountId: string | null;
  categoryId: string | null;
  originTransactionId: string | null;
  reminderDays: number;
  installmentCount: number;
  position: DebtPositionDto;
};

export type DebtInstallmentDto = {
  id: string;
  sequence: number;
  dueDate: CalendarDate;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
};

export type DebtPaymentDto = {
  id: string;
  paidAt: string;
  accountId: string;
  amount: number;
  principalAmount: number;
  extraAmount: number;
  repaymentTransactionId: string | null;
  chargeTransactionId: string | null;
  note: string | null;
};

export type DebtDetailDto = DebtDto & {
  installments: DebtInstallmentDto[];
  payments: DebtPaymentDto[];
};

export type DebtCurrencyTotals = { currency: string; payable: number; receivable: number };

export type DebtSummaryDto = {
  totals: DebtCurrencyTotals[];
  activeCount: number;
  overdueCount: number;
};

export type InstallmentScheduleBody = {
  firstDueDate: CalendarDate;
  count: number;
  /** Per installment; when omitted the principal is split evenly. */
  installmentAmount?: number | null;
};

export type CounterpartyRef = {
  counterpartyId?: string | null;
  counterpartyName?: string | null;
  counterpartyKind?: CounterpartyKind | null;
};

export type CreateDebtBody = CounterpartyRef & {
  direction: DebtDirection;
  sourceType: DebtSourceType;
  origin: DebtOrigin;
  title: string;
  principal: number;
  originatedAt: string;
  dueDate?: CalendarDate | null;
  note?: string | null;
  /** cash: the account the money went out of or came into. */
  accountId?: string | null;
  /** purchase: the expense category of what was bought. */
  categoryId?: string | null;
  /** purchase: required because no account tells the currency. */
  currency?: string | null;
  /** split: the expense transaction that someone owes part of. */
  originTransactionId?: string | null;
  schedule?: InstallmentScheduleBody | null;
  /** Days before a due date to start reminding; defaults by source when omitted. */
  reminderDays?: number | null;
};

export type UpdateDebtBody = {
  title?: string;
  sourceType?: DebtSourceType;
  counterpartyId?: string;
  principal?: number;
  dueDate?: CalendarDate | null;
  note?: string | null;
  schedule?: InstallmentScheduleBody | null;
  reminderDays?: number;
};

export type CreateDebtPaymentBody = {
  accountId: string;
  amount: number;
  paidAt: string;
  /** Category for the part above the remaining principal (interest, fee, tip). */
  extraCategoryId?: string | null;
  note?: string | null;
};

export type TransactionSplitBody = CounterpartyRef & {
  amount: number;
  title?: string | null;
  dueDate?: CalendarDate | null;
};

export type DebtReminderDto = {
  debtId: string;
  title: string;
  counterpartyName: string;
  direction: DebtDirection;
  currency: string;
  amount: number;
  dueDate: CalendarDate;
  /** Negative once the due date has passed. */
  daysUntil: number;
};

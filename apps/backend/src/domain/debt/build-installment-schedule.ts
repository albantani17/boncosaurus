import type { InstallmentScheduleBody } from '@boncosaurus/shared';
import { BadRequestError } from '../../errors/app-error';
import type { InstallmentDraft } from '../../types/debt.types';
import { addMonthsToDate } from '../../utils/add-months-to-date';

export const MAX_INSTALLMENTS = 120;

// Installments may add up to more than the principal: the difference is the interest or fee
// built into a paylater plan, and repayments past the principal are recorded as charges.
export function buildInstallmentSchedule(schedule: InstallmentScheduleBody, principal: number): InstallmentDraft[] {
  const { firstDueDate, count, installmentAmount } = schedule;
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new BadRequestError('INVALID_SCHEDULE', `Installment count must be between 1 and ${MAX_INSTALLMENTS}`);
  }

  const amounts = installmentAmount == null ? splitEvenly(principal, count) : Array<number>(count).fill(installmentAmount);
  if (amounts.reduce((sum, amount) => sum + amount, 0) < principal) {
    throw new BadRequestError('INVALID_SCHEDULE', 'Installments must add up to at least the principal');
  }
  if (amounts.some((amount) => amount <= 0)) {
    throw new BadRequestError('INVALID_SCHEDULE', 'Every installment must be a positive amount');
  }

  return amounts.map((amount, index) => ({
    sequence: index + 1,
    dueDate: addMonthsToDate(firstDueDate, index),
    amount
  }));
}

function splitEvenly(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const amounts = Array<number>(count).fill(base);
  amounts[count - 1] = total - base * (count - 1);
  return amounts;
}

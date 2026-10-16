import type { DebtReminderDto } from '@boncosaurus/shared';
import { daysBetweenDates } from '../../utils/days-between-dates';
import type { DebtView } from './build-debt-view';

type ReminderSource = Pick<
  DebtView,
  'id' | 'title' | 'counterpartyName' | 'direction' | 'currency' | 'status' | 'reminderDays' | 'position'
>;

export type DebtReminder = DebtReminderDto;

/** Active debts whose next due date falls inside their reminder window, or has already passed. */
export function selectDueReminders(debts: ReminderSource[], today: string): DebtReminder[] {
  const reminders: DebtReminder[] = [];
  for (const debt of debts) {
    const { nextDueDate, nextDueAmount } = debt.position;
    if (debt.status !== 'active' || nextDueDate === null || !nextDueAmount) continue;

    const daysUntil = daysBetweenDates(today, nextDueDate);
    if (daysUntil > debt.reminderDays) continue;
    reminders.push({
      debtId: debt.id,
      title: debt.title,
      counterpartyName: debt.counterpartyName,
      direction: debt.direction,
      currency: debt.currency,
      amount: nextDueAmount,
      dueDate: nextDueDate,
      daysUntil
    });
  }
  return reminders.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));
}

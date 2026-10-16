import type { DebtReminder } from './select-due-reminders';

export type ReminderDigest = { title: string; body: string; url: string };

const MAX_LINES = 3;
const DEBTS_URL = '/hutang';

const formatAmount = (amount: number, currency: string) =>
  currency === 'IDR' ? `Rp${amount.toLocaleString('id-ID')}` : `${currency} ${amount.toLocaleString('id-ID')}`;

const describeWhen = (daysUntil: number) => {
  if (daysUntil < 0) return `telat ${-daysUntil} hari`;
  if (daysUntil === 0) return 'hari ini';
  if (daysUntil === 1) return 'besok';
  return `${daysUntil} hari lagi`;
};

const describeReminder = ({ direction, counterpartyName, title, amount, currency, daysUntil }: DebtReminder) =>
  `${direction === 'payable' ? 'Bayar' : 'Tagih'} ${counterpartyName} (${title}) ${formatAmount(amount, currency)}, ${describeWhen(daysUntil)}`;

/** One daily push for all reminders of a workspace; links to the single debt when there is only one. */
export function buildReminderDigest(reminders: DebtReminder[]): ReminderDigest {
  const overdue = reminders.filter((reminder) => reminder.daysUntil < 0).length;
  const title =
    overdue > 0
      ? `${overdue} hutang/piutang lewat jatuh tempo`
      : `${reminders.length} hutang/piutang segera jatuh tempo`;
  const lines = reminders.slice(0, MAX_LINES).map(describeReminder);
  const more = reminders.length - lines.length;
  if (more > 0) lines.push(`+${more} lainnya`);

  const [only] = reminders;
  return { title, body: lines.join('\n'), url: reminders.length === 1 ? `${DEBTS_URL}/${only!.debtId}` : DEBTS_URL };
}

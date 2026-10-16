import type { DebtCurrencyTotals, DebtSummaryDto } from '@boncosaurus/shared';
import type { Debt } from '../../types/debt.types';
import type { DebtPosition } from './calculate-debt-position';

export type DebtSummary = DebtSummaryDto;

type DebtWithPosition = Pick<Debt, 'direction' | 'currency' | 'status'> & { position: DebtPosition };

export function summarizeDebts(debts: DebtWithPosition[]): DebtSummaryDto {
  const totalsByCurrency = new Map<string, DebtCurrencyTotals>();
  let activeCount = 0;
  let overdueCount = 0;

  for (const debt of debts) {
    if (debt.status !== 'active') continue;
    activeCount += 1;
    if (debt.position.isOverdue) overdueCount += 1;

    const totals = totalsByCurrency.get(debt.currency) ?? { currency: debt.currency, payable: 0, receivable: 0 };
    totals[debt.direction] += debt.position.remaining;
    totalsByCurrency.set(debt.currency, totals);
  }

  const totals = [...totalsByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  return { totals, activeCount, overdueCount };
}

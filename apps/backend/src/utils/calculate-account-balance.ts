import type { IncomingTransferTotal, OutgoingTotals } from '../types/finance.types';

export function calculateAccountBalance(
  initialBalance: number,
  outgoing?: OutgoingTotals,
  incoming?: IncomingTransferTotal
): number {
  const income = outgoing?.income ?? 0;
  const expense = outgoing?.expense ?? 0;
  const transferOut = outgoing?.transferOut ?? 0;
  const transferIn = incoming?.transferIn ?? 0;
  return initialBalance + income - expense - transferOut + transferIn;
}

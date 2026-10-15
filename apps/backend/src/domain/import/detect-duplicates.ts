import { normalizeName } from './match-by-name';

export type DuplicateCandidate = {
  accountId: string | null;
  occurredAt: Date;
  type: string;
  amount: number;
  note: string | null;
};

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function detectDuplicates(
  rows: DuplicateCandidate[],
  existing: DuplicateCandidate[],
  utcOffsetMinutes: number
): boolean[] {
  const remaining = new Map<string, number>();
  for (const transaction of existing) {
    const key = buildKey(transaction, utcOffsetMinutes);
    if (key) remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  return rows.map((row) => {
    const key = buildKey(row, utcOffsetMinutes);
    const available = key ? (remaining.get(key) ?? 0) : 0;
    if (!key || available === 0) return false;
    remaining.set(key, available - 1);
    return true;
  });
}

function buildKey(candidate: DuplicateCandidate, utcOffsetMinutes: number): string | null {
  if (!candidate.accountId) return null;
  const localDay = Math.floor((candidate.occurredAt.getTime() + utcOffsetMinutes * MINUTE_MS) / DAY_MS);
  const note = normalizeName(candidate.note ?? '');
  return [candidate.accountId, localDay, candidate.type, candidate.amount, note].join('|');
}

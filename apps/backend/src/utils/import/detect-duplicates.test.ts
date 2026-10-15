import { describe, expect, test } from 'bun:test';
import { type DuplicateCandidate, detectDuplicates } from './detect-duplicates';

const candidate = (overrides: Partial<DuplicateCandidate> = {}): DuplicateCandidate => ({
  accountId: 'acc-1',
  occurredAt: new Date('2025-03-05T05:00:00Z'),
  type: 'expense',
  amount: 25000,
  note: 'Kopi',
  ...overrides
});

describe('detectDuplicates', () => {
  test('flags a row identical to an existing transaction', () => {
    expect(detectDuplicates([candidate()], [candidate()], 0)).toEqual([true]);
  });

  test('ignores note case and whitespace', () => {
    expect(detectDuplicates([candidate({ note: ' KOPI ' })], [candidate()], 0)).toEqual([true]);
  });

  test('treats a null existing note as empty', () => {
    expect(detectDuplicates([candidate({ note: '' })], [candidate({ note: null })], 0)).toEqual([true]);
  });

  test('matches on the local day, not the UTC day', () => {
    const lateEvening = candidate({ occurredAt: new Date('2025-03-05T20:00:00Z') });
    const nextMorning = candidate({ occurredAt: new Date('2025-03-06T01:00:00Z') });
    expect(detectDuplicates([lateEvening], [nextMorning], 7 * 60)).toEqual([true]);
  });

  test('does not flag rows differing in account, amount, type or day', () => {
    const rows = [
      candidate({ accountId: 'acc-2' }),
      candidate({ amount: 1 }),
      candidate({ type: 'income' }),
      candidate({ occurredAt: new Date('2025-03-07T05:00:00Z') })
    ];
    expect(detectDuplicates(rows, [candidate()], 0)).toEqual([false, false, false, false]);
  });

  test('lets each existing transaction cover only one row', () => {
    expect(detectDuplicates([candidate(), candidate()], [candidate()], 0)).toEqual([true, false]);
  });

  test('flags both rows when two identical transactions already exist', () => {
    expect(detectDuplicates([candidate(), candidate()], [candidate(), candidate()], 0)).toEqual([true, true]);
  });

  test('never flags rows whose account is not resolved yet', () => {
    expect(detectDuplicates([candidate({ accountId: null })], [candidate()], 0)).toEqual([false]);
  });
});

import { describe, expect, test } from 'bun:test';
import type { DebtWriteOffProposal, TransactionProposal } from '@boncosaurus/shared';
import { findProposal, replaceProposal, savedRecordOf } from './proposal-parts';

const draft = {
  type: 'expense' as const,
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 25_000,
  toAmount: null,
  occurredAt: '2026-10-14T02:00:00.000Z',
  note: null
};
const writeOffDraft = {
  debtId: 'debt-1',
  debtTitle: 'Kopi',
  counterpartyName: 'Sultan',
  direction: 'receivable' as const,
  currency: 'IDR',
  amount: 4_000
};
const pending: TransactionProposal = { status: 'pending', draft };
const writeOff: DebtWriteOffProposal = { status: 'pending', draft: writeOffDraft };
const parts = [
  { type: 'text', text: 'Siap' },
  { type: 'tool-proposeTransaction', toolCallId: 'call-1', state: 'output-available', input: {}, output: pending },
  { type: 'tool-getSummary', toolCallId: 'call-2', state: 'output-available', input: {}, output: {} },
  { type: 'tool-proposeDebtWriteOff', toolCallId: 'call-3', state: 'output-available', input: {}, output: writeOff }
];

describe('findProposal', () => {
  test('finds the proposal output and its tool by tool call id', () => {
    expect(findProposal(parts, 'call-1')).toEqual({ toolName: 'proposeTransaction', proposal: pending });
    expect(findProposal(parts, 'call-3')).toEqual({ toolName: 'proposeDebtWriteOff', proposal: writeOff });
  });

  test('ignores other tools and unknown ids', () => {
    expect(findProposal(parts, 'call-2')).toBeNull();
    expect(findProposal(parts, 'missing')).toBeNull();
  });

  test('ignores proposals that are still streaming and malformed parts', () => {
    const streaming = [
      { type: 'tool-proposeTransaction', toolCallId: 'call-1', state: 'input-available' },
      { type: 'tool-proposeDebt', toolCallId: 'call-1', state: 'output-available', output: null },
      { type: 42, toolCallId: 'call-1' },
      null
    ];
    expect(findProposal(streaming, 'call-1')).toBeNull();
  });
});

describe('replaceProposal', () => {
  test('replaces only the matching output', () => {
    const saved: TransactionProposal = { status: 'saved', draft, transactionId: 'tx-1' };

    const updated = replaceProposal(parts, 'call-1', saved);

    expect(findProposal(updated, 'call-1')?.proposal).toEqual(saved);
    expect(updated[0]).toBe(parts[0]);
    expect(updated[2]).toBe(parts[2]);
  });
});

describe('savedRecordOf', () => {
  test('points a saved transaction draft at its transaction', () => {
    expect(savedRecordOf({ status: 'saved', draft, transactionId: 'tx-1' })).toEqual({ transactionId: 'tx-1' });
  });

  test('points a saved debt draft at its debt', () => {
    expect(savedRecordOf({ status: 'saved', draft: writeOffDraft, debtId: 'debt-1' })).toEqual({ debtId: 'debt-1' });
  });
});

import { describe, expect, test } from 'bun:test';
import { disbursementTypeOf, repaymentTypeOf } from './debt-transaction-types';

describe('disbursementTypeOf', () => {
  test('brings money in when borrowing', () => expect(disbursementTypeOf('payable')).toBe('income'));
  test('sends money out when lending', () => expect(disbursementTypeOf('receivable')).toBe('expense'));
});

describe('repaymentTypeOf', () => {
  test('sends money out when paying a debt back', () => expect(repaymentTypeOf('payable')).toBe('expense'));
  test('brings money in when being paid back', () => expect(repaymentTypeOf('receivable')).toBe('income'));
});

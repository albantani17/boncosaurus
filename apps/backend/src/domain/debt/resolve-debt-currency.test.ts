import { describe, expect, test } from 'bun:test';
import type { Account, Transaction } from '../../types/finance.types';
import { resolveDebtCurrency } from './resolve-debt-currency';

const usd = { currency: 'USD' } as Account;

describe('resolveDebtCurrency', () => {
  test('uses the account currency for a cash debt', () => {
    expect(resolveDebtCurrency({ direction: 'payable', origin: 'cash', principal: 1 }, { account: usd })).toBe('USD');
  });

  test('uses the currency of the split expense account', () => {
    const originTransaction = { transaction: {} as Transaction, account: usd, splitTotal: 0 };
    expect(resolveDebtCurrency({ direction: 'receivable', origin: 'split', principal: 1 }, { originTransaction })).toBe('USD');
  });

  test('uses the currency named by a purchase', () => {
    expect(resolveDebtCurrency({ direction: 'payable', origin: 'purchase', principal: 1, currency: 'SGD' }, {})).toBe('SGD');
  });
});

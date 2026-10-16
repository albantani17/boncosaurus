import { describe, expect, test } from 'bun:test';
import { splitPayment } from './split-payment';

describe('splitPayment', () => {
  test('puts a partial payment entirely on the principal', () => {
    expect(splitPayment(14_000, 18_500)).toEqual({ principalAmount: 14_000, extraAmount: 0 });
  });

  test('treats an exact payment as principal only', () => {
    expect(splitPayment(22_000, 22_000)).toEqual({ principalAmount: 22_000, extraAmount: 0 });
  });

  test('moves the part above the remaining principal into the extra', () => {
    expect(splitPayment(25_000, 22_000)).toEqual({ principalAmount: 22_000, extraAmount: 3_000 });
  });

  test('treats the whole payment as extra once the principal is repaid', () => {
    expect(splitPayment(15_000, 0)).toEqual({ principalAmount: 0, extraAmount: 15_000 });
  });
});

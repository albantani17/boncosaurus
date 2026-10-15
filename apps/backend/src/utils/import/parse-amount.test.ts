import { describe, expect, test } from 'bun:test';
import { parseAmount } from './parse-amount';

describe('parseAmount', () => {
  test('parses Indonesian format with comma decimals', () => {
    expect(parseAmount('1.250.000,00', ',')).toBe(1250000);
  });

  test('parses English format with dot decimals', () => {
    expect(parseAmount('1,250,000.00', '.')).toBe(1250000);
  });

  test('rounds fractions to a whole unit', () => {
    expect(parseAmount('1.250,60', ',')).toBe(1251);
  });

  test('strips currency symbols and spaces', () => {
    expect(parseAmount('Rp 2.450.000', ',')).toBe(2450000);
  });

  test('keeps a leading minus sign', () => {
    expect(parseAmount('-50.000', ',')).toBe(-50000);
  });

  test('treats parentheses as negative', () => {
    expect(parseAmount('(50,000.00)', '.')).toBe(-50000);
  });

  test('treats a trailing minus as negative', () => {
    expect(parseAmount('50.000-', ',')).toBe(-50000);
  });

  test('parses a plain integer', () => {
    expect(parseAmount('15000', '.')).toBe(15000);
  });

  test('returns null for empty or non-numeric text', () => {
    expect(parseAmount('', ',')).toBeNull();
    expect(parseAmount('   ', ',')).toBeNull();
    expect(parseAmount('n/a', ',')).toBeNull();
  });

  test('returns null for a lone minus sign', () => {
    expect(parseAmount('-', ',')).toBeNull();
  });
});

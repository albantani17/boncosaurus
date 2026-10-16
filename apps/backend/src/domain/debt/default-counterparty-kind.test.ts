import { describe, expect, test } from 'bun:test';
import { defaultCounterpartyKind } from './default-counterparty-kind';

describe('defaultCounterpartyKind', () => {
  test('treats a personal debt as being with a person', () => {
    expect(defaultCounterpartyKind('personal')).toBe('person');
  });

  test.each(['paylater', 'installment', 'credit_card', 'online_loan', 'bank_loan', 'other'] as const)(
    'treats %s as an institution',
    (sourceType) => expect(defaultCounterpartyKind(sourceType)).toBe('institution')
  );
});

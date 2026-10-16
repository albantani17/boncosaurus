import { describe, expect, test } from 'bun:test';
import { BadRequestError } from '../../errors/app-error';
import { toInvalidProposal } from './to-invalid-proposal';

describe('toInvalidProposal', () => {
  test('turns an app error into an invalid proposal', () => {
    expect(toInvalidProposal(new BadRequestError('INVALID_DEBT_ORIGIN', 'bad origin'))).toEqual({
      status: 'invalid',
      code: 'INVALID_DEBT_ORIGIN',
      message: 'bad origin'
    });
  });

  test('rethrows anything else', () => {
    expect(() => toInvalidProposal(new Error('db down'))).toThrow('db down');
  });
});

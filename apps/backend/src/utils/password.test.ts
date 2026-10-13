import { describe, expect, test } from 'bun:test';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  test('verifies the correct password', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('correct horse', hash)).toBe(true);
  });

  test('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('battery staple', hash)).toBe(false);
  });

  test('never stores the plain password in the hash', async () => {
    expect(await hashPassword('correct horse')).not.toContain('correct horse');
  });

  test('produces a different hash each time (salted)', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });
});

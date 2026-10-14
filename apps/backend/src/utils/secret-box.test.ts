import { describe, expect, test } from 'bun:test';
import { decryptSecret, encryptSecret } from './secret-box';

const KEY = new Uint8Array(32).fill(1);
const OTHER_KEY = new Uint8Array(32).fill(2);

describe('secret box', () => {
  test('round-trips a secret', async () => {
    const sealed = await encryptSecret(KEY, 'sk-test-123');
    expect(await decryptSecret(KEY, sealed)).toBe('sk-test-123');
  });

  test('does not contain the plaintext', async () => {
    expect(await encryptSecret(KEY, 'sk-test-123')).not.toContain('sk-test-123');
  });

  test('uses a fresh iv for each encryption', async () => {
    expect(await encryptSecret(KEY, 'same')).not.toBe(await encryptSecret(KEY, 'same'));
  });

  test('fails with a different key', async () => {
    const sealed = await encryptSecret(KEY, 'sk-test-123');
    expect(decryptSecret(OTHER_KEY, sealed)).rejects.toThrow();
  });

  test('rejects an unknown format', async () => {
    expect(decryptSecret(KEY, 'v9:abc:def')).rejects.toThrow('Unsupported secret format');
  });
});

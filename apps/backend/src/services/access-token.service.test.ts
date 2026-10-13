import { describe, expect, test } from 'bun:test';
import { SignJWT } from 'jose';
import { createAccessTokenService } from './access-token.service';

const SECRET = 'a'.repeat(32);

describe('access token service', () => {
  test('verifies a freshly signed token and returns the user id', async () => {
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });

    const token = await service.sign('user-1');

    expect(await service.verify(token)).toBe('user-1');
  });

  test('rejects a token signed with another secret', async () => {
    const other = createAccessTokenService({ secret: 'b'.repeat(32), ttlSeconds: 60 });
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });

    expect(await service.verify(await other.sign('user-1'))).toBeNull();
  });

  test('rejects an expired token', async () => {
    const key = new TextEncoder().encode(SECRET);
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(key);
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });

    expect(await service.verify(expired)).toBeNull();
  });

  test('rejects a tampered token', async () => {
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });
    const token = await service.sign('user-1');

    expect(await service.verify(`${token}x`)).toBeNull();
  });

  test('rejects garbage input', async () => {
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });

    expect(await service.verify('not-a-jwt')).toBeNull();
  });

  test('rejects an unsigned (alg none) token', async () => {
    const service = createAccessTokenService({ secret: SECRET, ttlSeconds: 60 });
    const header = Buffer.from('{"alg":"none"}').toString('base64url');
    const payload = Buffer.from('{"sub":"user-1"}').toString('base64url');

    expect(await service.verify(`${header}.${payload}.`)).toBeNull();
  });
});

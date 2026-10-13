import { describe, expect, test } from 'bun:test';
import { parseAuthConfig } from './parse-auth-config';

const SECRET = 'x'.repeat(32);

describe('parseAuthConfig', () => {
  test('throws when JWT_SECRET is missing', () => {
    expect(() => parseAuthConfig({})).toThrow('JWT_SECRET');
  });

  test('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => parseAuthConfig({ JWT_SECRET: 'short' })).toThrow('JWT_SECRET');
  });

  test('uses defaults for ttl, cookie and origin', () => {
    expect(parseAuthConfig({ JWT_SECRET: SECRET })).toEqual({
      jwtSecret: SECRET,
      accessTtlSeconds: 900,
      refreshTtlSeconds: 2_592_000,
      cookieSecure: false,
      frontendOrigin: 'http://localhost:5173'
    });
  });

  test('enables secure cookies by default in production', () => {
    expect(parseAuthConfig({ JWT_SECRET: SECRET, NODE_ENV: 'production' }).cookieSecure).toBe(true);
  });

  test('lets COOKIE_SECURE override the production default', () => {
    const config = parseAuthConfig({ JWT_SECRET: SECRET, NODE_ENV: 'production', COOKIE_SECURE: 'false' });

    expect(config.cookieSecure).toBe(false);
  });

  test('reads custom ttl and origin', () => {
    const config = parseAuthConfig({
      JWT_SECRET: SECRET,
      ACCESS_TOKEN_TTL_SECONDS: '60',
      REFRESH_TOKEN_TTL_SECONDS: '3600',
      FRONTEND_ORIGIN: 'https://app.example.com'
    });

    expect(config).toMatchObject({
      accessTtlSeconds: 60,
      refreshTtlSeconds: 3600,
      frontendOrigin: 'https://app.example.com'
    });
  });

  test('throws for a ttl that is not a positive integer', () => {
    expect(() => parseAuthConfig({ JWT_SECRET: SECRET, ACCESS_TOKEN_TTL_SECONDS: '-5' })).toThrow(
      'ACCESS_TOKEN_TTL_SECONDS'
    );
  });
});

import { describe, expect, test } from 'bun:test';
import { buildRefreshCookie } from './build-refresh-cookie';
import type { AuthConfig } from './parse-auth-config';

const config: AuthConfig = {
  jwtSecret: 'x'.repeat(32),
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
  cookieSecure: false,
  frontendOrigin: 'http://localhost:5173'
};

describe('buildRefreshCookie', () => {
  test('is httpOnly, lax and scoped to the auth path', () => {
    expect(buildRefreshCookie(config, 'tok', 3600)).toEqual({
      value: 'tok',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 3600
    });
  });

  test('follows the secure setting from config', () => {
    expect(buildRefreshCookie({ ...config, cookieSecure: true }, 'tok', 1).secure).toBe(true);
  });

  test('uses maxAge 0 to clear the cookie', () => {
    expect(buildRefreshCookie(config, '', 0).maxAge).toBe(0);
  });
});

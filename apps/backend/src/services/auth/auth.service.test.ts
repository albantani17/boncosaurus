import { describe, expect, test } from 'bun:test';
import type { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import type { NewRefreshToken, RefreshTokenRecord, UserRecord } from '../../types/auth.types';
import { createRecordingLogger } from '../../integrations/logging/create-recording-logger';
import { createAuthService } from './auth.service';

const NOW = new Date('2026-10-13T12:00:00Z');
const user: UserRecord = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  passwordHash: 'hash:secret123',
  createdAt: NOW
};

const createHarness = (
  options: { users?: UserRecord[]; tokens?: RefreshTokenRecord[]; rotateSucceeds?: boolean } = {}
) => {
  const { users = [user], tokens = [], rotateSucceeds = true } = options;
  const stored: RefreshTokenRecord[] = [...tokens];
  const revokedFamilies: string[] = [];
  let tokenCounter = 0;

  const refreshTokens: Omit<RefreshTokenRepository, 'revokeAllForUser'> = {
    insert: async (values: NewRefreshToken) => {
      stored.push({ id: `rt-${stored.length + 1}`, revokedAt: null, createdAt: NOW, ...values });
    },
    findByHash: async (hash) => stored.find((token) => token.tokenHash === hash),
    rotate: async (currentId, next) => {
      if (!rotateSucceeds) return false;
      const current = stored.find((token) => token.id === currentId)!;
      current.revokedAt = NOW;
      stored.push({ id: `rt-${stored.length + 1}`, revokedAt: null, createdAt: NOW, ...next });
      return true;
    },
    revokeFamily: async (familyId) => {
      revokedFamilies.push(familyId);
    }
  };

  const recorder = createRecordingLogger();
  const service = createAuthService({
    users: {
      findByEmail: async (email) => users.find((candidate) => candidate.email === email),
      findById: async (id) => users.find((candidate) => candidate.id === id)
    },
    workspaces: {
      listForUser: async () => [{ id: 'ws-1', name: 'Rumah', baseCurrency: 'IDR', role: 'owner' }]
    },
    refreshTokens,
    verifyPassword: async (password, hash) => hash === `hash:${password}`,
    dummyPasswordHash: 'hash:dummy',
    signAccessToken: async (userId) => `access:${userId}`,
    generateRefreshToken: () => `refresh-${++tokenCounter}`,
    hashRefreshToken: (token) => `h(${token})`,
    generateFamilyId: () => 'family-1',
    now: () => NOW,
    accessTtlSeconds: 900,
    refreshTtlSeconds: 3600,
    logger: recorder.logger
  });

  return { service, stored, revokedFamilies, events: recorder.events };
};

const tokenRecord = (overrides: Partial<RefreshTokenRecord> = {}): RefreshTokenRecord => ({
  id: 'rt-0',
  userId: 'user-1',
  familyId: 'family-1',
  tokenHash: 'h(old)',
  expiresAt: new Date(NOW.getTime() + 60_000),
  revokedAt: null,
  createdAt: NOW,
  ...overrides
});

describe('login', () => {
  test('returns tokens and the public user for valid credentials', async () => {
    const { service } = createHarness();

    const result = await service.login('admin@example.com', 'secret123');

    expect(result).toMatchObject({
      user: { id: 'user-1', email: 'admin@example.com', name: 'Admin' },
      accessToken: 'access:user-1',
      expiresIn: 900,
      refreshToken: 'refresh-1',
      refreshMaxAgeSeconds: 3600
    });
  });

  test('logs a successful login', async () => {
    const { service, events } = createHarness();

    await service.login('admin@example.com', 'secret123');

    expect(events()).toEqual(['auth.login']);
  });

  test('never returns the password hash', async () => {
    const { service } = createHarness();

    const result = await service.login('admin@example.com', 'secret123');

    expect(JSON.stringify(result)).not.toContain('hash:secret123');
  });

  test('stores only the hash of the refresh token with its expiry', async () => {
    const { service, stored } = createHarness();

    await service.login('admin@example.com', 'secret123');

    expect(stored[0]).toMatchObject({
      tokenHash: 'h(refresh-1)',
      familyId: 'family-1',
      expiresAt: new Date(NOW.getTime() + 3_600_000)
    });
  });

  test('normalizes the email before lookup', async () => {
    const { service } = createHarness();

    await expect(service.login('  Admin@Example.com ', 'secret123')).resolves.toBeDefined();
  });

  test('rejects a wrong password', async () => {
    const { service, events } = createHarness();

    await expect(service.login('admin@example.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS'
    });
    expect(events()).toEqual(['auth.login_failed']);
  });

  test('rejects an unknown email with the same error as a wrong password', async () => {
    const { service } = createHarness();

    await expect(service.login('nobody@example.com', 'secret123')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS'
    });
  });

  test('rejects a user without a password hash', async () => {
    const { service } = createHarness({ users: [{ ...user, passwordHash: null }] });

    await expect(service.login('admin@example.com', 'secret123')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS'
    });
  });
});

describe('refresh', () => {
  test('rotates the token and keeps the same family', async () => {
    const { service, stored } = createHarness({ tokens: [tokenRecord()] });

    const result = await service.refresh('old');

    expect(result).toMatchObject({ accessToken: 'access:user-1', refreshToken: 'refresh-1' });
    expect(stored.at(-1)).toMatchObject({ familyId: 'family-1', tokenHash: 'h(refresh-1)' });
  });

  test('rejects an unknown token', async () => {
    const { service } = createHarness();

    await expect(service.refresh('unknown')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  test('rejects an expired token without revoking the family', async () => {
    const { service, revokedFamilies } = createHarness({
      tokens: [tokenRecord({ expiresAt: new Date(NOW.getTime() - 1) })]
    });

    await expect(service.refresh('old')).rejects.toMatchObject({ code: 'REFRESH_TOKEN_EXPIRED' });
    expect(revokedFamilies).toEqual([]);
  });

  test('revokes the whole family when a revoked token is reused', async () => {
    const { service, revokedFamilies, events } = createHarness({
      tokens: [tokenRecord({ revokedAt: NOW })]
    });

    await expect(service.refresh('old')).rejects.toMatchObject({ code: 'REFRESH_TOKEN_REUSED' });
    expect(revokedFamilies).toEqual(['family-1']);
    expect(events()).toEqual(['auth.refresh_reused']);
  });

  test('treats a lost rotation race as reuse and revokes the family', async () => {
    const { service, revokedFamilies } = createHarness({
      tokens: [tokenRecord()],
      rotateSucceeds: false
    });

    await expect(service.refresh('old')).rejects.toMatchObject({ code: 'REFRESH_TOKEN_REUSED' });
    expect(revokedFamilies).toEqual(['family-1']);
  });

  test('rejects a token whose user no longer exists', async () => {
    const { service } = createHarness({ users: [], tokens: [tokenRecord()] });

    await expect(service.refresh('old')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });
});

describe('logout', () => {
  test('revokes the family of the presented token', async () => {
    const { service, revokedFamilies, events } = createHarness({ tokens: [tokenRecord()] });

    await service.logout('old');

    expect(revokedFamilies).toEqual(['family-1']);
    expect(events()).toEqual(['auth.logout']);
  });

  test('does nothing without a token', async () => {
    const { service, revokedFamilies } = createHarness();

    await service.logout(undefined);

    expect(revokedFamilies).toEqual([]);
  });

  test('does not fail for an unknown token', async () => {
    const { service } = createHarness();

    await expect(service.logout('unknown')).resolves.toBeUndefined();
  });
});

describe('getProfile', () => {
  test('returns the user with their workspaces', async () => {
    const { service } = createHarness();

    const profile = await service.getProfile('user-1');

    expect(profile.user.email).toBe('admin@example.com');
    expect(profile.workspaces).toHaveLength(1);
  });

  test('rejects when the user no longer exists', async () => {
    const { service } = createHarness({ users: [] });

    await expect(service.getProfile('user-1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('startSession', () => {
  test('stores a new refresh token family and returns fresh tokens', async () => {
    const { service, stored } = createHarness();

    const session = await service.startSession('user-1');

    expect(session).toEqual({
      accessToken: 'access:user-1',
      expiresIn: 900,
      refreshToken: 'refresh-1',
      refreshMaxAgeSeconds: 3600
    });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ userId: 'user-1', familyId: 'family-1', tokenHash: 'h(refresh-1)' });
  });
});

import { describe, expect, test } from 'bun:test';
import type { UserRecord } from '../types/auth.types';
import { createProfileService } from './profile.service';

const user: UserRecord = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  passwordHash: 'hash:secret123',
  createdAt: new Date('2026-10-01T00:00:00Z')
};

const setup = (options: { updateError?: unknown; stored?: UserRecord } = {}) => {
  const updates: unknown[] = [];
  const passwordHashes: string[] = [];
  const revokedUsers: string[] = [];
  const stored = options.stored ?? user;
  const service = createProfileService({
    users: {
      findById: async (id) => (id === stored.id ? stored : undefined),
      updateProfile: async (_id, patch) => {
        if (options.updateError) throw options.updateError;
        updates.push(patch);
        return { ...stored, ...patch };
      },
      setPasswordHash: async (_id, hash) => {
        passwordHashes.push(hash);
      }
    },
    refreshTokens: {
      revokeAllForUser: async (userId) => {
        revokedUsers.push(userId);
      }
    },
    verifyPassword: async (password, hash) => hash === `hash:${password}`,
    hashPassword: async (password) => `hash:${password}`
  });
  return { service, updates, passwordHashes, revokedUsers };
};

describe('updateProfile', () => {
  test('changes the name without asking for the password', async () => {
    const { service, updates } = setup();

    const result = await service.updateProfile('user-1', { name: ' Budi ' });

    expect(updates).toEqual([{ name: 'Budi' }]);
    expect(result).toEqual({ id: 'user-1', email: 'admin@example.com', name: 'Budi' });
  });

  test('changes the email when the current password is correct, normalizing it', async () => {
    const { service, updates } = setup();

    await service.updateProfile('user-1', { email: ' New@Example.com ', currentPassword: 'secret123' });

    expect(updates).toEqual([{ email: 'new@example.com' }]);
  });

  test('requires the current password to change the email', async () => {
    const { service, updates } = setup();

    await expect(service.updateProfile('user-1', { email: 'new@example.com' })).rejects.toMatchObject({
      status: 400,
      code: 'PASSWORD_REQUIRED'
    });
    expect(updates).toHaveLength(0);
  });

  test('rejects an email change with a wrong password', async () => {
    const { service } = setup();

    await expect(
      service.updateProfile('user-1', { email: 'new@example.com', currentPassword: 'nope' })
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('does not ask for the password when the email is unchanged apart from case', async () => {
    const { service, updates } = setup();

    await service.updateProfile('user-1', { email: 'ADMIN@example.com', name: 'Admin 2' });

    expect(updates).toEqual([{ name: 'Admin 2' }]);
  });

  test('returns the user untouched when nothing changes', async () => {
    const { service, updates } = setup();

    const result = await service.updateProfile('user-1', { name: '  ' });

    expect(updates).toHaveLength(0);
    expect(result.name).toBe('Admin');
  });

  test('reports a taken email as a conflict', async () => {
    const { service } = setup({ updateError: { code: '23505' } });

    await expect(
      service.updateProfile('user-1', { email: 'taken@example.com', currentPassword: 'secret123' })
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  test('throws not found for an unknown user', async () => {
    const { service } = setup();

    await expect(service.updateProfile('ghost', { name: 'X' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('changePassword', () => {
  test('stores the new hash and revokes every session of the user', async () => {
    const { service, passwordHashes, revokedUsers } = setup();

    await service.changePassword('user-1', 'secret123', 'brand-new-pass');

    expect(passwordHashes).toEqual(['hash:brand-new-pass']);
    expect(revokedUsers).toEqual(['user-1']);
  });

  test('rejects a wrong current password without changing anything', async () => {
    const { service, passwordHashes, revokedUsers } = setup();

    await expect(service.changePassword('user-1', 'nope', 'brand-new-pass')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS'
    });
    expect(passwordHashes).toHaveLength(0);
    expect(revokedUsers).toHaveLength(0);
  });

  test('rejects reusing the current password', async () => {
    const { service } = setup();

    await expect(service.changePassword('user-1', 'secret123', 'secret123')).rejects.toMatchObject({
      code: 'SAME_PASSWORD'
    });
  });

  test('rejects users without a password hash', async () => {
    const { service } = setup({ stored: { ...user, passwordHash: null } });

    await expect(service.changePassword('user-1', 'secret123', 'brand-new-pass')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS'
    });
  });
});

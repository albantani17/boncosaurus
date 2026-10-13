import { describe, expect, test } from 'bun:test';
import { createWorkspaceService } from './workspace.service';

const WS_A = '01a135e6-d680-7000-8d53-80cb1c25a960';
const WS_B = '01a135e6-d680-7000-8d53-80cb1c25a961';

const createService = (memberOf: string[], firstWorkspaceId?: string) =>
  createWorkspaceService({
    isMember: async (_userId, workspaceId) => memberOf.includes(workspaceId),
    findFirstWorkspaceIdForUser: async () => firstWorkspaceId
  });

describe('resolveWorkspaceId', () => {
  test('returns the first workspace of the user by default', async () => {
    const service = createService([WS_A], WS_A);

    expect(await service.resolveWorkspaceId('user')).toBe(WS_A);
  });

  test('throws NO_WORKSPACE when the user belongs to no workspace', async () => {
    const service = createService([], undefined);

    await expect(service.resolveWorkspaceId('user')).rejects.toMatchObject({
      status: 403,
      code: 'NO_WORKSPACE'
    });
  });

  test('returns the requested workspace when the user is a member', async () => {
    const service = createService([WS_A, WS_B], WS_A);

    expect(await service.resolveWorkspaceId('user', WS_B)).toBe(WS_B);
  });

  test('throws NOT_A_MEMBER for a workspace the user does not belong to', async () => {
    const service = createService([WS_A], WS_A);

    await expect(service.resolveWorkspaceId('user', WS_B)).rejects.toMatchObject({
      status: 403,
      code: 'NOT_A_MEMBER'
    });
  });

  test('rejects a requested workspace id that is not a UUID', async () => {
    const service = createService([WS_A], WS_A);

    await expect(service.resolveWorkspaceId('user', 'nope')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_WORKSPACE_ID'
    });
  });
});

import { describe, expect, test } from 'bun:test';
import type { PushConfig } from '../../config/parse-push-config';
import type { DebtReminder } from '../../domain/debt/select-due-reminders';
import type { PushSubscriptionRecord } from '../../types/push.types';
import { createReminderDigestService } from './reminder-digest.service';

const config: PushConfig = { publicKey: 'pub', privateKey: 'priv', subject: 'mailto:a@b.c', reminderHour: 8 };
const morning = new Date(2026, 9, 16, 9, 0);
const subscription = (endpoint: string, userId = 'u1', workspaceId = 'ws'): PushSubscriptionRecord => ({
  id: endpoint,
  userId,
  workspaceId,
  endpoint,
  p256dh: 'p',
  auth: 'a',
  createdAt: morning,
  updatedAt: morning
});
const reminder: DebtReminder = {
  debtId: 'debt-1',
  title: 'Sepatu',
  counterpartyName: 'Kredivo',
  direction: 'payable',
  currency: 'IDR',
  amount: 105_000,
  dueDate: '2026-10-18',
  daysUntil: 2
};

function setup(options: {
  enabled?: boolean;
  now?: Date;
  subscriptions?: PushSubscriptionRecord[];
  reminders?: Record<string, DebtReminder[]>;
  alreadySent?: string[];
} = {}) {
  const { enabled = true, now = morning, subscriptions = [subscription('a')], reminders = { ws: [reminder] }, alreadySent = [] } =
    options;
  const calls = { claims: [] as string[], delivered: [] as { endpoints: string[]; url: string }[], reminderLoads: [] as string[] };
  const service = createReminderDigestService({
    config: enabled ? config : null,
    repository: {
      listAll: async () => subscriptions,
      claimDigest: async (userId, workspaceId, sentOn) => {
        const key = `${userId}:${workspaceId}:${sentOn}`;
        calls.claims.push(key);
        return !alreadySent.includes(key);
      }
    },
    debts: {
      listReminders: async (workspaceId) => {
        calls.reminderLoads.push(workspaceId);
        return reminders[workspaceId] ?? [];
      }
    },
    push: {
      deliver: async (targets, payload) => {
        calls.delivered.push({ endpoints: targets.map((target) => target.endpoint), url: payload.url });
        return { sent: targets.length, gone: 0, failed: 0 };
      }
    },
    now: () => now
  });
  return { service, calls };
}

describe('runDigest', () => {
  test('sends one digest per user and workspace to all their devices', async () => {
    const { service, calls } = setup({ subscriptions: [subscription('a'), subscription('b'), subscription('c', 'u2')] });

    expect(await service.runDigest()).toEqual({ recipients: 2, sent: 3, gone: 0, failed: 0 });
    expect(calls.delivered).toEqual([
      { endpoints: ['a', 'b'], url: '/hutang/debt-1' },
      { endpoints: ['c'], url: '/hutang/debt-1' }
    ]);
    expect(calls.claims).toEqual(['u1:ws:2026-10-16', 'u2:ws:2026-10-16']);
    expect(calls.reminderLoads).toEqual(['ws']);
  });

  test('does not send twice on the same day', async () => {
    const { service, calls } = setup({ alreadySent: ['u1:ws:2026-10-16'] });

    expect(await service.runDigest()).toMatchObject({ recipients: 0 });
    expect(calls.delivered).toEqual([]);
  });

  test('skips workspaces with nothing due without claiming the day', async () => {
    const { service, calls } = setup({ reminders: {} });

    await service.runDigest();

    expect(calls.claims).toEqual([]);
  });

  test('waits until the reminder hour', async () => {
    const { service, calls } = setup({ now: new Date(2026, 9, 16, 7, 59) });

    expect(await service.runDigest()).toEqual({ recipients: 0, sent: 0, gone: 0, failed: 0 });
    expect(calls.reminderLoads).toEqual([]);
  });

  test('does nothing when push is not configured', async () => {
    const { service, calls } = setup({ enabled: false });

    await service.runDigest();

    expect(calls.reminderLoads).toEqual([]);
  });
});

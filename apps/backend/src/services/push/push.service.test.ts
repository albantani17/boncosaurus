import { describe, expect, test } from 'bun:test';
import type { PushConfig } from '../../config/parse-push-config';
import type { PushOutcome, PushTarget } from '../../integrations/push/send-web-push';
import { createRecordingLogger } from '../../integrations/logging/create-recording-logger';
import type { PushSubscriptionRecord } from '../../types/push.types';
import { createPushService } from './push.service';

const config: PushConfig = { publicKey: 'pub', privateKey: 'priv', subject: 'mailto:a@b.c', reminderHour: 8 };
const actor = { userId: 'u1', workspaceId: 'ws' };
const subscription = (endpoint: string): PushSubscriptionRecord => ({
  id: endpoint,
  userId: 'u1',
  workspaceId: 'ws',
  endpoint,
  p256dh: 'p',
  auth: 'a',
  createdAt: new Date(),
  updatedAt: new Date()
});
const body = { endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } };

function setup(options: { enabled?: boolean; outcomes?: Record<string, PushOutcome | Error>; subscriptions?: string[] } = {}) {
  const { enabled = true, outcomes = {}, subscriptions = [] } = options;
  const calls: Record<string, unknown[]> = { upsert: [], delete: [], deleteByEndpoint: [], sent: [] };
  const recorder = createRecordingLogger();
  const service = createPushService({
    config: enabled ? config : null,
    repository: {
      upsertSubscription: async (values) => {
        calls.upsert!.push(values);
      },
      deleteSubscription: async (userId, endpoint) => {
        calls.delete!.push({ userId, endpoint });
      },
      deleteByEndpoint: async (endpoint) => {
        calls.deleteByEndpoint!.push(endpoint);
      },
      listForUser: async () => subscriptions.map(subscription)
    },
    send: enabled
      ? async (target: PushTarget, payload: object) => {
          calls.sent!.push({ endpoint: target.endpoint, payload });
          const outcome = outcomes[target.endpoint] ?? 'sent';
          if (outcome instanceof Error) throw outcome;
          return outcome;
        }
      : null,
    logger: recorder.logger
  });
  return { service, calls, events: recorder.events };
}

describe('getConfig', () => {
  test('exposes the public key when push is configured', () => {
    expect(setup().service.getConfig()).toEqual({ enabled: true, publicKey: 'pub' });
  });

  test('reports push as off without keys', () => {
    expect(setup({ enabled: false }).service.getConfig()).toEqual({ enabled: false, publicKey: null });
  });
});

describe('subscribe', () => {
  test('stores the browser subscription for the user and workspace', async () => {
    const { service, calls } = setup();

    await service.subscribe(actor, body);

    expect(calls.upsert).toEqual([{ userId: 'u1', workspaceId: 'ws', endpoint: body.endpoint, p256dh: 'p', auth: 'a' }]);
  });

  test('refuses when push is not configured', async () => {
    const { service } = setup({ enabled: false });
    await expect(service.subscribe(actor, body)).rejects.toMatchObject({ status: 503, code: 'PUSH_NOT_CONFIGURED' });
  });
});

describe('unsubscribe', () => {
  test('removes only the caller subscription', async () => {
    const { service, calls } = setup();

    await service.unsubscribe(actor, body.endpoint);

    expect(calls.delete).toEqual([{ userId: 'u1', endpoint: body.endpoint }]);
  });
});

describe('deliver', () => {
  test('counts deliveries, drops expired subscriptions and logs failures', async () => {
    const { service, calls, events } = setup({ outcomes: { gone: 'gone', broken: new Error('timeout') } });
    const targets = ['ok', 'gone', 'broken'].map((endpoint) => ({ endpoint, p256dh: 'p', auth: 'a' }));

    const result = await service.deliver(targets, { title: 't', body: 'b', url: '/hutang' });

    expect(result).toEqual({ sent: 1, gone: 1, failed: 1 });
    expect(calls.deleteByEndpoint).toEqual(['gone']);
    expect(events()).toEqual(['push.send_failed']);
  });
});

describe('sendTest', () => {
  test('sends a test notification to every device of the user', async () => {
    const { service, calls } = setup({ subscriptions: ['a', 'b'] });

    expect(await service.sendTest(actor)).toEqual({ sent: 2, gone: 0, failed: 0 });
    expect(calls.sent).toHaveLength(2);
  });

  test('reports when no device accepted it', async () => {
    const { service } = setup({ subscriptions: ['a'], outcomes: { a: new Error('rejected') } });
    await expect(service.sendTest(actor)).rejects.toMatchObject({ status: 502, code: 'PUSH_SEND_FAILED' });
  });

  test('refuses when push is not configured', async () => {
    const { service } = setup({ enabled: false });
    await expect(service.sendTest(actor)).rejects.toMatchObject({ code: 'PUSH_NOT_CONFIGURED' });
  });
});

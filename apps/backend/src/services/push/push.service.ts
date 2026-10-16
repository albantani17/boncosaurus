import type { PushConfigDto, PushSubscriptionBody } from '@boncosaurus/shared';
import type { PushConfig } from '../../config/parse-push-config';
import { BadGatewayError, ServiceUnavailableError } from '../../errors/app-error';
import type { PushSender, PushTarget } from '../../integrations/push/send-web-push';
import type { PushRepository } from '../../repositories/push.repository';
import type { ServiceLogger } from '../../types/logger.types';
import type { ActorContext } from '../ai-provider/ai-provider.service';

export type PushPayload = { title: string; body: string; url: string };
export type DeliveryResult = { sent: number; gone: number; failed: number };

type Dependencies = {
  config: PushConfig | null;
  repository: Pick<PushRepository, 'upsertSubscription' | 'deleteSubscription' | 'deleteByEndpoint' | 'listForUser'>;
  send: PushSender | null;
  logger: ServiceLogger;
};

const TEST_PAYLOAD: PushPayload = {
  title: 'Boncosaurus',
  body: 'Notifikasi pengingat sudah aktif di perangkat ini.',
  url: '/hutang'
};

export function createPushService({ config, repository, send, logger }: Dependencies) {
  function requireSender(): PushSender {
    if (!config || !send) throw new ServiceUnavailableError('PUSH_NOT_CONFIGURED', 'Web Push is not configured');
    return send;
  }

  /** Sends to every target, deleting subscriptions the browser has dropped. */
  async function deliver(targets: PushTarget[], payload: PushPayload): Promise<DeliveryResult> {
    const sender = requireSender();
    const result: DeliveryResult = { sent: 0, gone: 0, failed: 0 };
    for (const target of targets) {
      try {
        if ((await sender(target, payload)) === 'sent') {
          result.sent += 1;
          continue;
        }
        result.gone += 1;
        await repository.deleteByEndpoint(target.endpoint);
      } catch (error) {
        result.failed += 1;
        logger.warn({ event: 'push.send_failed', err: error }, 'web push delivery failed');
      }
    }
    return result;
  }

  return {
    deliver,

    getConfig: (): PushConfigDto => ({ enabled: config !== null, publicKey: config?.publicKey ?? null }),

    async subscribe({ userId, workspaceId }: ActorContext, subscription: PushSubscriptionBody): Promise<void> {
      requireSender();
      await repository.upsertSubscription({
        userId,
        workspaceId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });
    },

    async unsubscribe({ userId }: ActorContext, endpoint: string): Promise<void> {
      await repository.deleteSubscription(userId, endpoint);
    },

    async sendTest({ userId }: ActorContext): Promise<DeliveryResult> {
      requireSender();
      const result = await deliver(await repository.listForUser(userId), TEST_PAYLOAD);
      if (result.sent === 0 && result.failed > 0) {
        throw new BadGatewayError('PUSH_SEND_FAILED', 'The push service did not accept the notification');
      }
      return result;
    }
  };
}

export type PushService = ReturnType<typeof createPushService>;

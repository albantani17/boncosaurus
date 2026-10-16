import webpush from 'web-push';
import type { PushConfig } from '../../config/parse-push-config';
import { isGonePushError } from './is-gone-push-error';

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushOutcome = 'sent' | 'gone';
export type PushSender = (target: PushTarget, payload: object) => Promise<PushOutcome>;

const TTL_SECONDS = 12 * 60 * 60;

export function createWebPushSender({ publicKey, privateKey, subject }: PushConfig): PushSender {
  const vapidDetails = { subject, publicKey, privateKey };
  return async ({ endpoint, p256dh, auth }, payload) => {
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload), {
        vapidDetails,
        TTL: TTL_SECONDS
      });
      return 'sent';
    } catch (error) {
      if (isGonePushError(error)) return 'gone';
      throw error;
    }
  };
}

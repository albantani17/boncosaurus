import type { PushConfig } from '../../config/parse-push-config';
import { buildReminderDigest } from '../../domain/debt/build-reminder-digest';
import type { PushRepository } from '../../repositories/push.repository';
import type { PushSubscriptionRecord } from '../../types/push.types';
import { toCalendarDate } from '../../utils/to-calendar-date';
import type { DebtService } from '../debt/debt.service';
import type { DeliveryResult, PushService } from './push.service';

type Dependencies = {
  config: PushConfig | null;
  repository: Pick<PushRepository, 'listAll' | 'claimDigest'>;
  debts: Pick<DebtService, 'listReminders'>;
  push: Pick<PushService, 'deliver'>;
  now: () => Date;
};

export type DigestRunResult = { recipients: number } & DeliveryResult;

const groupByRecipient = (subscriptions: PushSubscriptionRecord[]) => {
  const groups = new Map<string, PushSubscriptionRecord[]>();
  for (const subscription of subscriptions) {
    const key = `${subscription.userId}:${subscription.workspaceId}`;
    groups.set(key, [...(groups.get(key) ?? []), subscription]);
  }
  return [...groups.values()];
};

/** Once a day, from the configured hour, pushes each subscribed user a digest of their due debts. */
export function createReminderDigestService({ config, repository, debts, push, now }: Dependencies) {
  return {
    async runDigest(): Promise<DigestRunResult> {
      const result: DigestRunResult = { recipients: 0, sent: 0, gone: 0, failed: 0 };
      const current = now();
      if (!config || current.getHours() < config.reminderHour) return result;

      const today = toCalendarDate(current);
      const remindersByWorkspace = new Map<string, ReturnType<DebtService['listReminders']>>();
      for (const subscriptions of groupByRecipient(await repository.listAll())) {
        const { userId, workspaceId } = subscriptions[0]!;
        if (!remindersByWorkspace.has(workspaceId)) remindersByWorkspace.set(workspaceId, debts.listReminders(workspaceId));
        const reminders = await remindersByWorkspace.get(workspaceId)!;
        if (reminders.length === 0 || !(await repository.claimDigest(userId, workspaceId, today))) continue;

        const delivery = await push.deliver(subscriptions, buildReminderDigest(reminders));
        result.recipients += 1;
        result.sent += delivery.sent;
        result.gone += delivery.gone;
        result.failed += delivery.failed;
      }
      return result;
    }
  };
}

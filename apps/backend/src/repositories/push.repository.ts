import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { pushSubscriptions, reminderDigests } from '../db/schema';
import type { NewPushSubscription, PushSubscriptionRecord } from '../types/push.types';

export type PushRepository = {
  upsertSubscription(values: NewPushSubscription): Promise<void>;
  deleteSubscription(userId: string, endpoint: string): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  listForUser(userId: string): Promise<PushSubscriptionRecord[]>;
  listAll(): Promise<PushSubscriptionRecord[]>;
  /** Records today's digest for a recipient; false when another run already sent it. */
  claimDigest(userId: string, workspaceId: string, sentOn: string): Promise<boolean>;
};

export const pushRepository: PushRepository = {
  // A browser keeps one endpoint; whoever subscribes with it last owns it.
  async upsertSubscription(values) {
    await db
      .insert(pushSubscriptions)
      .values(values)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: values.userId, workspaceId: values.workspaceId, p256dh: values.p256dh, auth: values.auth }
      });
  },

  async deleteSubscription(userId, endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  },

  async deleteByEndpoint(endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  },

  listForUser: (userId) => db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)),

  listAll: () => db.select().from(pushSubscriptions),

  async claimDigest(userId, workspaceId, sentOn) {
    const rows = await db
      .insert(reminderDigests)
      .values({ userId, workspaceId, sentOn })
      .onConflictDoNothing()
      .returning({ id: reminderDigests.id });
    return rows.length > 0;
  }
};

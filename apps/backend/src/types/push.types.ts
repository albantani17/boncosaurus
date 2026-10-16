import type { pushSubscriptions } from '../db/schema';

export type { PushConfigDto, PushSubscriptionBody } from '@boncosaurus/shared';

export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

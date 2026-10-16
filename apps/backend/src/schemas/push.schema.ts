import { type Assert, type IsMutuallyAssignable, type PushSubscriptionBody, type PushUnsubscribeBody } from '@boncosaurus/shared';
import { type Static, t } from 'elysia';

const endpoint = t.String({ pattern: '^https://', maxLength: 2048 });
const key = t.String({ minLength: 1, maxLength: 512 });

export const pushSubscriptionBody = t.Object({
  endpoint,
  keys: t.Object({ p256dh: key, auth: key })
});

export const pushUnsubscribeBody = t.Object({ endpoint });

type _SubscribeContract = Assert<IsMutuallyAssignable<Static<typeof pushSubscriptionBody>, PushSubscriptionBody>>;
type _UnsubscribeContract = Assert<IsMutuallyAssignable<Static<typeof pushUnsubscribeBody>, PushUnsubscribeBody>>;

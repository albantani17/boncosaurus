export type PushConfigDto = { enabled: boolean; publicKey: string | null };

/** The shape of `PushSubscription#toJSON()` that the backend stores. */
export type PushSubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushUnsubscribeBody = { endpoint: string };

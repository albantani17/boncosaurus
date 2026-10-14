import { t } from 'elysia';

const uuid = t.String({ format: 'uuid' });

export const createConversationBody = t.Object({ providerId: t.Optional(uuid) });

export const renameConversationBody = t.Object({ title: t.String({ minLength: 1, maxLength: 100 }) });

export const sendMessageBody = t.Object({
  message: t.Object({ parts: t.Array(t.Unknown(), { maxItems: 20 }) }),
  providerId: t.Optional(uuid),
  timeZone: t.Optional(t.String({ maxLength: 64 }))
});

export const draftBody = t.Object({
  messageId: uuid,
  toolCallId: t.String({ minLength: 1, maxLength: 200 })
});

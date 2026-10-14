import { t } from 'elysia';

export const summaryQuery = t.Object({
  from: t.Date(),
  to: t.Date()
});

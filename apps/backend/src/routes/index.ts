import { Elysia } from 'elysia';
import { aiProviderRoutes } from './ai-providers.routes';
import { accountRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { chatRoutes } from './chat.routes';
import { categoryRoutes } from './categories.routes';
import { counterpartyRoutes } from './counterparties.routes';
import { debtRoutes } from './debts.routes';
import { importRoutes } from './import.routes';
import { profileRoutes } from './profile.routes';
import { pushRoutes } from './push.routes';
import { reportRoutes } from './reports.routes';
import { transactionRoutes } from './transactions.routes';

export const apiRoutes = new Elysia()
  .use(authRoutes)
  .use(profileRoutes)
  .use(accountRoutes)
  .use(categoryRoutes)
  .use(transactionRoutes)
  .use(counterpartyRoutes)
  .use(debtRoutes)
  .use(pushRoutes)
  .use(reportRoutes)
  .use(aiProviderRoutes)
  .use(chatRoutes)
  .use(importRoutes);

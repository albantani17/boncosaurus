import { Elysia } from 'elysia';
import { accountRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { categoryRoutes } from './categories.routes';
import { profileRoutes } from './profile.routes';
import { reportRoutes } from './reports.routes';
import { transactionRoutes } from './transactions.routes';

export const apiRoutes = new Elysia()
  .use(authRoutes)
  .use(profileRoutes)
  .use(accountRoutes)
  .use(categoryRoutes)
  .use(transactionRoutes)
  .use(reportRoutes);

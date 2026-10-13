import { Elysia } from 'elysia';
import { accountRoutes } from './accounts.routes';
import { categoryRoutes } from './categories.routes';
import { transactionRoutes } from './transactions.routes';

export const apiRoutes = new Elysia()
  .use(accountRoutes)
  .use(categoryRoutes)
  .use(transactionRoutes);

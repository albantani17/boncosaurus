import { Elysia } from 'elysia';
import { accountRoutes } from './accounts.routes';
import { categoryRoutes } from './categories.routes';

export const apiRoutes = new Elysia().use(accountRoutes).use(categoryRoutes);

import { Elysia } from 'elysia';
import { accountRoutes } from './accounts.routes';

export const apiRoutes = new Elysia().use(accountRoutes);

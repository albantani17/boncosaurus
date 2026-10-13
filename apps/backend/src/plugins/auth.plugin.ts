import { Elysia } from 'elysia';
import { authenticateRequest } from './authenticate-request';

export const authPlugin = new Elysia({ name: 'auth' }).resolve({ as: 'scoped' }, async ({ headers }) => ({
  userId: await authenticateRequest(headers.authorization)
}));

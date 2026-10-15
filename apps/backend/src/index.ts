import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { sql } from 'drizzle-orm';
import { authConfig } from './container';
import { db } from './db';
import { errorHandlerPlugin } from './plugins/error-handler.plugin';
import { apiRoutes } from './routes';
import { bootstrapRepository } from './repositories/bootstrap.repository';
import { bootstrapFirstRun } from './services/bootstrap.service';
import { parseBootstrapConfig } from './config/parse-bootstrap-config';
import { hashPassword } from './integrations/crypto/password';

const BOOTSTRAP_MESSAGES = {
  created: 'First-run: created admin, default workspace and categories',
  'admin-password-set': 'First-run: set the password of the existing admin from ADMIN_PASSWORD',
  'already-initialized': 'First-run: already initialized, nothing to do',
  skipped: 'First-run: ADMIN_EMAIL is not set, skipping bootstrap'
} as const;

const bootstrapStatus = await bootstrapFirstRun(
  parseBootstrapConfig(process.env),
  bootstrapRepository,
  hashPassword
);
console.log(BOOTSTRAP_MESSAGES[bootstrapStatus]);

const app = new Elysia()
  .use(cors({ origin: authConfig.frontendOrigin, credentials: true }))
  .use(errorHandlerPlugin)
  .get('/', () => ({ name: 'boncosaurus-api' }))
  .get('/health', async () => {
    await db.execute(sql`select 1`);
    return { status: 'ok' };
  })
  .use(apiRoutes)
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' });

console.log(`API running at ${app.server?.url}`);

export type App = typeof app;

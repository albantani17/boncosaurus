import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { sql } from 'drizzle-orm';
import { authConfig, logger, pushConfig, reminderDigestService } from './container';
import { db } from './db';
import { errorHandlerPlugin } from './plugins/error-handler.plugin';
import { requestLoggerPlugin } from './plugins/request-logger.plugin';
import { apiRoutes } from './routes';
import { bootstrapRepository } from './repositories/bootstrap.repository';
import { bootstrapFirstRun } from './services/bootstrap/bootstrap.service';
import { parseBootstrapConfig } from './config/parse-bootstrap-config';
import { hashPassword } from './integrations/crypto/password';
import { scheduleEvery } from './utils/schedule-every';

process.on('unhandledRejection', (reason) => logger.fatal({ err: reason }, 'unhandled promise rejection'));
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  process.exit(1);
});

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
logger.info({ event: 'bootstrap', status: bootstrapStatus }, BOOTSTRAP_MESSAGES[bootstrapStatus]);

const app = new Elysia()
  .use(requestLoggerPlugin)
  .use(cors({ origin: authConfig.frontendOrigin, credentials: true }))
  .use(errorHandlerPlugin)
  .get('/', () => ({ name: 'boncosaurus-api' }))
  .get('/health', async () => {
    await db.execute(sql`select 1`);
    return { status: 'ok' };
  })
  .use(apiRoutes)
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' });

logger.info(`API running at ${app.server?.url}`);

const REMINDER_CHECK_INTERVAL_MS = 15 * 60_000;

if (pushConfig) {
  scheduleEvery(
    REMINDER_CHECK_INTERVAL_MS,
    async () => {
      const result = await reminderDigestService.runDigest();
      if (result.recipients > 0) logger.info({ event: 'push.digest_sent', ...result }, 'sent debt reminder pushes');
    },
    (error) => logger.error({ event: 'push.digest_failed', err: error }, 'debt reminder push run failed')
  );
} else {
  logger.info({ event: 'push.disabled' }, 'Web Push is off: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set');
}

export type App = typeof app;

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { bootstrapRepository } from './repositories/bootstrap.repository';
import { bootstrapFirstRun } from './services/bootstrap.service';
import { parseBootstrapConfig } from './utils/parse-bootstrap-config';

const BOOTSTRAP_MESSAGES = {
  created: 'First-run: created admin, default workspace and categories',
  'already-initialized': 'First-run: already initialized, nothing to do',
  skipped: 'First-run: ADMIN_EMAIL is not set, skipping bootstrap'
} as const;

const bootstrapStatus = await bootstrapFirstRun(
  parseBootstrapConfig(process.env),
  bootstrapRepository
);
console.log(BOOTSTRAP_MESSAGES[bootstrapStatus]);

const app = new Elysia()
  .use(cors())
  .get('/', () => ({ name: 'boncosaurus-api' }))
  .get('/health', async () => {
    await db.execute(sql`select 1`);
    return { status: 'ok' };
  })
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' });

console.log(`API running at ${app.server?.url}`);

export type App = typeof app;

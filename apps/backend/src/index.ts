import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { sql } from 'drizzle-orm';
import { db } from './db';

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

import { Elysia } from 'elysia';
import { reportService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { summaryQuery } from '../schemas/report.schema';

export const reportRoutes = new Elysia({ prefix: '/reports' })
  .use(workspacePlugin)
  .get('/summary', ({ workspaceId, query }) => reportService.getSummary(workspaceId, query), {
    query: summaryQuery
  });

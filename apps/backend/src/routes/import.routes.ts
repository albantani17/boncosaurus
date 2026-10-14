import { Elysia } from 'elysia';
import { importCommitService, importPreviewService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { commitImportBody, previewImportBody } from '../schemas/import.schema';

export const importRoutes = new Elysia({ prefix: '/imports' })
  .use(workspacePlugin)
  .post(
    '/preview',
    async ({ userId, workspaceId, body }) =>
      importPreviewService.previewImport(
        { userId, workspaceId },
        {
          fileName: body.file.name,
          bytes: new Uint8Array(await body.file.arrayBuffer()),
          timeZone: body.timeZone,
          utcOffsetMinutes: body.utcOffsetMinutes
        }
      ),
    { body: previewImportBody }
  )
  .post(
    '/commit',
    async ({ userId, workspaceId, body, set }) => {
      set.status = 201;
      return importCommitService.commitImport({ userId, workspaceId }, body);
    },
    { body: commitImportBody }
  );

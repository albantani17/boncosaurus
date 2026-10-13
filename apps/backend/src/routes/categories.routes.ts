import { Elysia } from 'elysia';
import { categoryService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createCategoryBody, updateCategoryBody } from '../schemas/category.schema';
import { idParams } from '../schemas/id-params.schema';

export const categoryRoutes = new Elysia({ prefix: '/categories' })
  .use(workspacePlugin)
  .get('/', ({ workspaceId }) => categoryService.listCategories(workspaceId))
  .post(
    '/',
    async ({ workspaceId, body, set }) => {
      set.status = 201;
      return categoryService.createCategory(workspaceId, body);
    },
    { body: createCategoryBody }
  )
  .get('/:id', ({ workspaceId, params }) => categoryService.getCategory(workspaceId, params.id), {
    params: idParams
  })
  .patch(
    '/:id',
    ({ workspaceId, params, body }) => categoryService.updateCategory(workspaceId, params.id, body),
    { params: idParams, body: updateCategoryBody }
  )
  .delete(
    '/:id',
    async ({ workspaceId, params, set }) => {
      await categoryService.deleteCategory(workspaceId, params.id);
      set.status = 204;
    },
    { params: idParams }
  );

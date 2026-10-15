import { describe, expect, test } from 'bun:test';
import type { CategoryRepository } from '../../repositories/category.repository';
import type { Category } from '../../types/finance.types';
import { createCategoryService } from './category.service';

const now = new Date();
const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  workspaceId: 'ws',
  parentId: null,
  name: 'Makanan',
  type: 'expense',
  icon: null,
  color: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const createFakeRepository = (overrides: Partial<CategoryRepository> = {}) => {
  const deleted: string[] = [];
  const repository: CategoryRepository = {
    list: async () => [],
    findById: async () => undefined,
    insert: async (values) => makeCategory(values as Partial<Category>),
    update: async (_ws, id, patch) => makeCategory({ id, ...patch }),
    delete: async (_ws, id) => {
      deleted.push(id);
    },
    countChildren: async () => 0,
    countTransactions: async () => 0,
    ...overrides
  };
  return { repository, deleted };
};

describe('createCategory', () => {
  test('creates a root category in the given workspace', async () => {
    const { repository } = createFakeRepository();

    const category = await createCategoryService(repository).createCategory('ws-9', {
      name: 'Gaji',
      type: 'income'
    });

    expect(category.workspaceId).toBe('ws-9');
  });

  test('creates a subcategory under a root parent of the same type', async () => {
    const { repository } = createFakeRepository({ findById: async () => makeCategory({ id: 'p' }) });

    const category = await createCategoryService(repository).createCategory('ws', {
      name: 'Makan di luar',
      type: 'expense',
      parentId: 'p'
    });

    expect(category.parentId).toBe('p');
  });

  test('throws not found when the parent does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(
      createCategoryService(repository).createCategory('ws', { name: 'X', type: 'expense', parentId: 'nope' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('rejects a parent that is itself a subcategory', async () => {
    const { repository } = createFakeRepository({
      findById: async () => makeCategory({ parentId: 'root' })
    });

    await expect(
      createCategoryService(repository).createCategory('ws', { name: 'X', type: 'expense', parentId: 'c' })
    ).rejects.toMatchObject({ code: 'PARENT_NOT_ROOT' });
  });

  test('rejects a parent of a different type', async () => {
    const { repository } = createFakeRepository({
      findById: async () => makeCategory({ type: 'income' })
    });

    await expect(
      createCategoryService(repository).createCategory('ws', { name: 'X', type: 'expense', parentId: 'c' })
    ).rejects.toMatchObject({ code: 'CATEGORY_TYPE_MISMATCH' });
  });

  test('maps a unique violation to CATEGORY_NAME_TAKEN', async () => {
    const { repository } = createFakeRepository({
      insert: async () => {
        throw { code: '23505' };
      }
    });

    await expect(
      createCategoryService(repository).createCategory('ws', { name: 'X', type: 'expense' })
    ).rejects.toMatchObject({ status: 409, code: 'CATEGORY_NAME_TAKEN' });
  });

  test('rethrows write errors that are not name conflicts', async () => {
    const { repository } = createFakeRepository({
      insert: async () => {
        throw new Error('connection lost');
      }
    });

    await expect(
      createCategoryService(repository).createCategory('ws', { name: 'X', type: 'expense' })
    ).rejects.toThrow('connection lost');
  });
});

describe('listCategories', () => {
  test('returns the categories of the workspace', async () => {
    const categories = [makeCategory()];
    const { repository } = createFakeRepository({
      list: async (workspaceId) => (workspaceId === 'ws' ? categories : [])
    });

    expect(await createCategoryService(repository).listCategories('ws')).toEqual(categories);
  });
});

describe('getCategory', () => {
  test('returns an existing category', async () => {
    const { repository } = createFakeRepository({ findById: async () => makeCategory() });

    expect(await createCategoryService(repository).getCategory('ws', 'cat-1')).toMatchObject({ id: 'cat-1' });
  });

  test('throws not found when the category does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(createCategoryService(repository).getCategory('ws', 'x')).rejects.toMatchObject({
      status: 404
    });
  });
});

describe('updateCategory', () => {
  test('throws not found when the category does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(
      createCategoryService(repository).updateCategory('ws', 'x', { name: 'N' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('applies the patch to an existing category', async () => {
    const { repository } = createFakeRepository({ findById: async () => makeCategory() });

    const category = await createCategoryService(repository).updateCategory('ws', 'cat-1', {
      isArchived: true
    });

    expect(category.isArchived).toBe(true);
  });
});

describe('deleteCategory', () => {
  test('deletes an unused category', async () => {
    const { repository, deleted } = createFakeRepository({ findById: async () => makeCategory() });

    await createCategoryService(repository).deleteCategory('ws', 'cat-1');

    expect(deleted).toEqual(['cat-1']);
  });

  test('refuses to delete a category with subcategories', async () => {
    const { repository, deleted } = createFakeRepository({
      findById: async () => makeCategory(),
      countChildren: async () => 2
    });

    await expect(createCategoryService(repository).deleteCategory('ws', 'cat-1')).rejects.toMatchObject({
      status: 409,
      code: 'CATEGORY_IN_USE'
    });
    expect(deleted).toEqual([]);
  });

  test('refuses to delete a category used by transactions', async () => {
    const { repository } = createFakeRepository({
      findById: async () => makeCategory(),
      countTransactions: async () => 1
    });

    await expect(createCategoryService(repository).deleteCategory('ws', 'cat-1')).rejects.toMatchObject({
      code: 'CATEGORY_IN_USE'
    });
  });
});

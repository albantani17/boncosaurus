import { BadRequestError, ConflictError, NotFoundError } from '../../errors/app-error';
import type { CategoryRepository } from '../../repositories/category.repository';
import type { Category, CategoryPatch, NewCategory } from '../../types/finance.types';
import { isUniqueViolation } from '../../utils/is-unique-violation';

export type CreateCategoryInput = Pick<NewCategory, 'name' | 'type'> &
  Partial<Pick<NewCategory, 'parentId' | 'icon' | 'color'>>;

export function createCategoryService(repository: CategoryRepository) {
  async function requireCategory(workspaceId: string, id: string) {
    const category = await repository.findById(workspaceId, id);
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async function assertValidParent(workspaceId: string, input: CreateCategoryInput) {
    if (!input.parentId) return;
    const parent = await repository.findById(workspaceId, input.parentId);
    if (!parent) throw new NotFoundError('Parent category');
    if (parent.parentId) {
      throw new BadRequestError('PARENT_NOT_ROOT', 'Categories support only one level of nesting');
    }
    if (parent.type !== input.type) {
      throw new BadRequestError('CATEGORY_TYPE_MISMATCH', 'Subcategory must have the same type as its parent');
    }
  }

  async function runUniqueNameWrite<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('CATEGORY_NAME_TAKEN', 'A category with this name already exists here');
      }
      throw error;
    }
  }

  return {
    listCategories: (workspaceId: string) => repository.list(workspaceId),

    getCategory: (workspaceId: string, id: string) => requireCategory(workspaceId, id),

    async createCategory(workspaceId: string, input: CreateCategoryInput): Promise<Category> {
      await assertValidParent(workspaceId, input);
      return runUniqueNameWrite(() => repository.insert({ ...input, workspaceId }));
    },

    async updateCategory(workspaceId: string, id: string, patch: CategoryPatch): Promise<Category> {
      await requireCategory(workspaceId, id);
      const updated = await runUniqueNameWrite(() => repository.update(workspaceId, id, patch));
      if (!updated) throw new NotFoundError('Category');
      return updated;
    },

    async deleteCategory(workspaceId: string, id: string): Promise<void> {
      await requireCategory(workspaceId, id);
      const [children, transactions] = await Promise.all([
        repository.countChildren(workspaceId, id),
        repository.countTransactions(workspaceId, id)
      ]);
      if (children > 0 || transactions > 0) {
        throw new ConflictError(
          'CATEGORY_IN_USE',
          'Category has subcategories or transactions; archive it instead of deleting'
        );
      }
      await repository.delete(workspaceId, id);
    }
  };
}

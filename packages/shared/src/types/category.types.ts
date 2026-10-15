import type { CategoryType } from '../constants/category-types';

export type CategoryDto = {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  isArchived: boolean;
};

export type CreateCategoryBody = {
  name: string;
  type: CategoryType;
  parentId?: string;
  icon?: string | null;
  color?: string | null;
};

export type UpdateCategoryBody = {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isArchived?: boolean;
};

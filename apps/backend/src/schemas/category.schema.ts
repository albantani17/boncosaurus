import {
  CATEGORY_TYPES,
  type Assert,
  type CreateCategoryBody,
  type IsMutuallyAssignable,
  type UpdateCategoryBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';

const categoryType = t.UnionEnum(CATEGORY_TYPES);
const name = t.String({ minLength: 1, maxLength: 100 });
const icon = t.Union([t.String({ maxLength: 50 }), t.Null()]);
const color = t.Union([t.String({ maxLength: 20 }), t.Null()]);

export const createCategoryBody = t.Object({
  name,
  type: categoryType,
  parentId: t.Optional(t.String({ format: 'uuid' })),
  icon: t.Optional(icon),
  color: t.Optional(color)
});

export const updateCategoryBody = t.Object({
  name: t.Optional(name),
  icon: t.Optional(icon),
  color: t.Optional(color),
  isArchived: t.Optional(t.Boolean())
});

type _CreateCategoryContract = Assert<IsMutuallyAssignable<Static<typeof createCategoryBody>, CreateCategoryBody>>;
type _UpdateCategoryContract = Assert<IsMutuallyAssignable<Static<typeof updateCategoryBody>, UpdateCategoryBody>>;

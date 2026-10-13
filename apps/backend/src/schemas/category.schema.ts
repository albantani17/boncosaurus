import { t } from 'elysia';

const categoryType = t.Union([t.Literal('income'), t.Literal('expense')]);
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

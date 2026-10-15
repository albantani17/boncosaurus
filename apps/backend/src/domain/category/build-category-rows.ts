import type { CategoryRow, DefaultCategory } from '../../types/bootstrap.types';

export function buildCategoryRows(
  workspaceId: string,
  defaults: DefaultCategory[],
  generateId: () => string = () => Bun.randomUUIDv7()
): CategoryRow[] {
  return defaults.flatMap(({ name, type, children = [] }) => {
    const parent: CategoryRow = { id: generateId(), workspaceId, name, type };
    const childRows = children.map(
      (childName): CategoryRow => ({
        id: generateId(),
        workspaceId,
        parentId: parent.id,
        name: childName,
        type
      })
    );
    return [parent, ...childRows];
  });
}

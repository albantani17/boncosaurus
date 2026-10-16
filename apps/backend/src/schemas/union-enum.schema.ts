import { t } from 'elysia';

// Elysia's t.UnionEnum defaults to its first value, which silently fills omitted optional
// fields (a PATCH with only `note` would reset `type`). Clearing the default keeps them absent.
export const unionEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  t.UnionEnum(values, { default: undefined });

export function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(([, value]) => value !== undefined);
  return { ...base, ...Object.fromEntries(definedEntries) };
}

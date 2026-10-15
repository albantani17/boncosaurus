export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function findByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const wanted = normalizeName(name);
  if (!wanted) return undefined;
  return items.find((item) => normalizeName(item.name) === wanted);
}

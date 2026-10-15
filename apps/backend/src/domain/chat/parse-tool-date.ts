// Model-supplied dates must carry an explicit offset (or Z) so they never depend on the server TZ.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function parseToolDate(value: string): Date | null {
  if (!ISO_WITH_OFFSET.test(value.trim())) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

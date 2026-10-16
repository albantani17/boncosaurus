const GONE_STATUSES = new Set([404, 410]);

/** The push service answers 404/410 once a browser drops a subscription; it should then be deleted. */
export function isGonePushError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { statusCode } = error as { statusCode?: unknown };
  return typeof statusCode === 'number' && GONE_STATUSES.has(statusCode);
}

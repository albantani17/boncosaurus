const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const resolveRequestId = (header: string | null | undefined, generateId: () => string) =>
  header && REQUEST_ID_PATTERN.test(header) ? header : generateId();

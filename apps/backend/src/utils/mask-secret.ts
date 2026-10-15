const VISIBLE_CHARS = 4;

export const maskSecret = (secret: string) =>
  secret.length <= VISIBLE_CHARS ? '••••' : `••••${secret.slice(-VISIBLE_CHARS)}`;

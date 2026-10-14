export type FormResult<T> = { ok: true; value: T } | { ok: false; message: string };

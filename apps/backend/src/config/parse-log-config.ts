export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export const LOG_FORMATS = ['json', 'pretty'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
export type LogFormat = (typeof LOG_FORMATS)[number];
export type LogConfig = { level: LogLevel; format: LogFormat };

type Env = Record<string, string | undefined>;

function pick<T extends string>(name: string, raw: string | undefined, allowed: readonly T[], fallback: T): T {
  const value = raw?.trim().toLowerCase();
  if (!value) return fallback;
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function parseLogConfig(env: Env): LogConfig {
  const defaultFormat = env.NODE_ENV === 'production' ? 'json' : 'pretty';
  return {
    level: pick('LOG_LEVEL', env.LOG_LEVEL, LOG_LEVELS, 'info'),
    format: pick('LOG_FORMAT', env.LOG_FORMAT, LOG_FORMATS, defaultFormat)
  };
}

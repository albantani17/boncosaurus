import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import type { LogConfig } from '../../config/parse-log-config';
import type { Logger } from '../../types/logger.types';

const REDACT_PATHS = [
  'password',
  'currentPassword',
  'newPassword',
  'apiKey',
  'refreshToken',
  '*.password',
  '*.apiKey',
  '*.authorization',
  '*.cookie'
];

export function createLogger(config: LogConfig): Logger {
  const options = { level: config.level, base: { service: 'backend' }, redact: REDACT_PATHS };
  // pino-pretty as a synchronous stream avoids pino's worker-thread transports.
  return config.format === 'pretty'
    ? pino(options, pinoPretty({ colorize: true, ignore: 'pid,hostname,service' }))
    : pino(options);
}

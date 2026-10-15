import type { Logger as PinoLogger } from 'pino';

export type Logger = Pick<PinoLogger, 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'child'>;

export type ServiceLogger = Pick<Logger, 'info' | 'warn' | 'error'>;

import type { ServiceLogger } from '../../types/logger.types';

export type LogEntry = { level: 'info' | 'warn' | 'error'; fields: Record<string, unknown>; message?: string };

// Test double for services: keeps every entry in memory so tests can assert on logged events.
export function createRecordingLogger() {
  const entries: LogEntry[] = [];
  const record =
    (level: LogEntry['level']) =>
    (fields: unknown, message?: string): void => {
      entries.push({ level, fields: (fields ?? {}) as Record<string, unknown>, message });
    };
  const logger = { info: record('info'), warn: record('warn'), error: record('error') } as ServiceLogger;
  const events = () => entries.map((entry) => entry.fields.event);
  return { logger, entries, events };
}

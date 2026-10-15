import { describe, expect, test } from 'bun:test';
import { createRecordingLogger } from './create-recording-logger';

describe('createRecordingLogger', () => {
  test('records level, fields and message in order', () => {
    const { logger, entries, events } = createRecordingLogger();
    logger.info({ event: 'a' }, 'first');
    logger.warn({ event: 'b' });

    expect(entries).toEqual([
      { level: 'info', fields: { event: 'a' }, message: 'first' },
      { level: 'warn', fields: { event: 'b' }, message: undefined }
    ]);
    expect(events()).toEqual(['a', 'b']);
  });
});

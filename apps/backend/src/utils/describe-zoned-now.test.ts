import { describe, expect, test } from 'bun:test';
import { describeZonedNow, isValidTimeZone } from './describe-zoned-now';

const NOW = new Date('2026-10-14T08:30:00Z');

describe('describeZonedNow', () => {
  test('formats the local time with its offset', () => {
    expect(describeZonedNow(NOW, 'Asia/Jakarta')).toEqual({
      iso: '2026-10-14T15:30:00+07:00',
      offset: '+07:00',
      weekday: 'Rabu'
    });
  });

  test('uses +00:00 for UTC', () => {
    expect(describeZonedNow(NOW, 'UTC').iso).toBe('2026-10-14T08:30:00+00:00');
  });

  test('handles negative offsets', () => {
    expect(describeZonedNow(NOW, 'America/New_York').offset).toBe('-04:00');
  });

  test('falls back to UTC for an unknown time zone', () => {
    expect(describeZonedNow(NOW, 'Mars/Base').offset).toBe('+00:00');
  });
});

describe('isValidTimeZone', () => {
  test('accepts IANA names and rejects unknown ones', () => {
    expect(isValidTimeZone('Asia/Makassar')).toBe(true);
    expect(isValidTimeZone('Nope/Nope')).toBe(false);
  });
});

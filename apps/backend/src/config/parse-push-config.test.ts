import { describe, expect, test } from 'bun:test';
import { parsePushConfig } from './parse-push-config';

const keys = { VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' };

describe('parsePushConfig', () => {
  test('is off when no VAPID keys are set', () => {
    expect(parsePushConfig({})).toBeNull();
    expect(parsePushConfig({ VAPID_PUBLIC_KEY: ' ', VAPID_PRIVATE_KEY: '' })).toBeNull();
  });

  test('uses defaults for the subject and reminder hour', () => {
    expect(parsePushConfig(keys)).toEqual({
      publicKey: 'pub',
      privateKey: 'priv',
      subject: 'mailto:admin@localhost',
      reminderHour: 8
    });
  });

  test('reads a custom subject and reminder hour', () => {
    expect(parsePushConfig({ ...keys, VAPID_SUBJECT: 'https://bonco.example', REMINDER_HOUR: '19' })).toMatchObject({
      subject: 'https://bonco.example',
      reminderHour: 19
    });
  });

  test('requires both keys', () => {
    expect(() => parsePushConfig({ VAPID_PUBLIC_KEY: 'pub' })).toThrow('VAPID_PRIVATE_KEY');
  });

  test('rejects a subject that is not mailto or https', () => {
    expect(() => parsePushConfig({ ...keys, VAPID_SUBJECT: 'admin@example.com' })).toThrow('VAPID_SUBJECT');
  });

  test.each(['24', '-1', '7.5', 'pagi'])('rejects the reminder hour %p', (REMINDER_HOUR) => {
    expect(() => parsePushConfig({ ...keys, REMINDER_HOUR })).toThrow('REMINDER_HOUR');
  });
});

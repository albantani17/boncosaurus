import { describe, expect, test } from 'bun:test';
import { scheduleEvery } from './schedule-every';

describe('scheduleEvery', () => {
  test('runs right away and then on every interval until stopped', async () => {
    let runs = 0;
    const stop = scheduleEvery(5, async () => runs++, () => {});

    await Bun.sleep(18);
    stop();
    const runsWhenStopped = runs;
    await Bun.sleep(15);

    expect(runsWhenStopped).toBeGreaterThanOrEqual(3);
    expect(runs).toBe(runsWhenStopped);
  });

  test('skips a tick while the previous run is still busy', async () => {
    let started = 0;
    const stop = scheduleEvery(2, async () => {
      started++;
      await Bun.sleep(20);
    }, () => {});

    await Bun.sleep(15);
    stop();

    expect(started).toBe(1);
  });

  test('reports a failing run and keeps going', async () => {
    const errors: unknown[] = [];
    const stop = scheduleEvery(5, async () => {
      throw new Error('boom');
    }, (error) => errors.push(error));

    await Bun.sleep(13);
    stop();

    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

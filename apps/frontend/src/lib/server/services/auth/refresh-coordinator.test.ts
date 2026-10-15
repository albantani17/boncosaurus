import { describe, expect, test } from 'bun:test';
import { type Session, createRefreshCoordinator } from './refresh-coordinator';

const session = (refreshToken: string): Session => ({
	accessToken: `access-for-${refreshToken}`,
	expiresIn: 900,
	refreshToken,
	refreshMaxAgeSeconds: 100
});

const setup = (options: { fail?: boolean } = {}) => {
	const calls: string[] = [];
	const clock = { time: 0 };
	const coordinator = createRefreshCoordinator({
		refresh: async (token) => {
			calls.push(token);
			if (options.fail) throw new Error('rejected');
			return session(`next-${token}`);
		},
		now: () => clock.time,
		graceMs: 30_000
	});
	return { coordinator, calls, clock };
};

describe('createRefreshCoordinator', () => {
	test('shares one backend call between concurrent requests with the same token', async () => {
		const { coordinator, calls } = setup();

		const [first, second] = await Promise.all([coordinator.refresh('t1'), coordinator.refresh('t1')]);

		expect(calls).toEqual(['t1']);
		expect(second).toBe(first);
	});

	test('reuses the result during the grace window after it settled', async () => {
		const { coordinator, calls, clock } = setup();
		await coordinator.refresh('t1');

		clock.time = 29_999;
		await coordinator.refresh('t1');

		expect(calls).toEqual(['t1']);
	});

	test('calls the backend again once the grace window has passed', async () => {
		const { coordinator, calls, clock } = setup();
		await coordinator.refresh('t1');

		clock.time = 30_000;
		await coordinator.refresh('t1');

		expect(calls).toEqual(['t1', 't1']);
	});

	test('refreshes different tokens independently', async () => {
		const { coordinator, calls } = setup();

		await Promise.all([coordinator.refresh('a'), coordinator.refresh('b')]);

		expect(calls).toEqual(['a', 'b']);
	});

	test('does not cache failures', async () => {
		const { coordinator, calls } = setup({ fail: true });

		await expect(coordinator.refresh('t1')).rejects.toThrow('rejected');
		await expect(coordinator.refresh('t1')).rejects.toThrow('rejected');

		expect(calls).toEqual(['t1', 't1']);
	});
});

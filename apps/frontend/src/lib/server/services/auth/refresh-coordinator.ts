export type Session = {
	accessToken: string;
	expiresIn: number;
	refreshToken: string;
	refreshMaxAgeSeconds: number;
};

type Dependencies = {
	refresh: (refreshToken: string) => Promise<Session>;
	now: () => number;
	graceMs: number;
};

type Entry = { promise: Promise<Session>; settledAt?: number };

// The backend revokes a whole token family when a refresh token is used twice, so concurrent
// requests carrying the same cookie must share a single refresh call.
export function createRefreshCoordinator({ refresh, now, graceMs }: Dependencies) {
	const entries = new Map<string, Entry>();

	function dropExpiredEntries() {
		for (const [token, entry] of entries) {
			if (entry.settledAt !== undefined && now() - entry.settledAt >= graceMs) entries.delete(token);
		}
	}

	return {
		refresh(refreshToken: string): Promise<Session> {
			dropExpiredEntries();
			const existing = entries.get(refreshToken);
			if (existing) return existing.promise;

			const entry: Entry = { promise: refresh(refreshToken) };
			entries.set(refreshToken, entry);
			entry.promise.then(
				() => {
					entry.settledAt = now();
				},
				() => {
					entries.delete(refreshToken);
				}
			);
			return entry.promise;
		}
	};
}

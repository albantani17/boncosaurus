import type { PageServerLoad } from './$types';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/health`).catch(() => null);
	return { api: res?.ok ? await res.json() : null };
};

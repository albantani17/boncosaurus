import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	API_URL: {
		schema: (value) => value?.trim() || 'http://localhost:3000',
		description: 'Base URL of the Boncosaurus backend, reachable from the SvelteKit server'
	},
	COOKIE_SECURE: {
		schema: (value) => value?.trim() || undefined,
		description: 'Set to "true" when served over HTTPS (defaults to true when NODE_ENV=production)'
	}
});

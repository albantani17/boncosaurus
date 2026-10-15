import type { AiProvider } from '../../../types/ai.types';
import { ApiError } from '@boncosaurus/shared';
import type { BackendClient } from '../../api/create-backend-client';

export type AiProvidersState = { aiReady: boolean; providers: AiProvider[] };

// Without AI_SECRET_KEY the backend answers AI_NOT_CONFIGURED; pages then show setup help instead of failing.
export async function loadAiProviders(client: BackendClient): Promise<AiProvidersState> {
	try {
		return { aiReady: true, providers: await client.get<AiProvider[]>('/ai/providers') };
	} catch (error) {
		if (error instanceof ApiError && error.code === 'AI_NOT_CONFIGURED') return { aiReady: false, providers: [] };
		throw error;
	}
}

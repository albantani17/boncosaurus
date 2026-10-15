import { ApiError, parseApiErrorBody } from '@boncosaurus/shared';

type Options = {
	fetch: typeof fetch;
	baseUrl: string;
	accessToken?: string | null;
	workspaceId?: string;
};

type RequestOptions = { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal };

async function toApiError(response: Response): Promise<ApiError> {
	const payload: unknown = await response.json().catch(() => null);
	const { code, message } = parseApiErrorBody(payload, response.status);
	return new ApiError(response.status, code, message);
}

export function createBackendClient({ fetch, baseUrl, accessToken, workspaceId }: Options) {
	async function request(path: string, { method = 'GET', body, headers = {}, signal }: RequestOptions = {}) {
		const response = await fetch(`${baseUrl}${path}`, {
			method,
			headers: {
				...(body === undefined || body instanceof FormData ? {} : { 'content-type': 'application/json' }),
				...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
				...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
				...headers
			},
			body: body === undefined || body instanceof FormData ? (body as FormData | undefined) : JSON.stringify(body),
			signal
		});
		if (!response.ok) throw await toApiError(response);
		return response;
	}

	return {
		request,
		async get<T>(path: string): Promise<T> {
			return (await request(path)).json() as Promise<T>;
		},
		async send<T>(path: string, options: RequestOptions): Promise<T> {
			return (await request(path, options)).json() as Promise<T>;
		}
	};
}

export type BackendClient = ReturnType<typeof createBackendClient>;

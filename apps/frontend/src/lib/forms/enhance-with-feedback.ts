import { type SubmitFunction, applyAction } from '$app/forms';

type Options = {
	prepare?: (formData: FormData) => void;
	onPending?: (pending: boolean) => void;
	onSuccess?: (message: string | undefined) => void;
	onFailure: (message: string) => void;
};

const FALLBACK_FAILURE = 'Terjadi kesalahan. Coba lagi sebentar lagi.';

export function enhanceWithFeedback({ prepare, onPending, onSuccess, onFailure }: Options): SubmitFunction {
	return ({ formData }) => {
		prepare?.(formData);
		onPending?.(true);
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update({ reset: false });
				onSuccess?.(typeof result.data?.message === 'string' ? result.data.message : undefined);
			} else if (result.type === 'failure') {
				onFailure(typeof result.data?.message === 'string' ? result.data.message : FALLBACK_FAILURE);
			} else {
				await applyAction(result);
			}
			onPending?.(false);
		};
	};
}

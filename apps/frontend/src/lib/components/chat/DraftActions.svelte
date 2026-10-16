<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import FormMessage from '../ui/FormMessage.svelte';

	type Props = {
		status: 'pending' | 'saved' | 'dismissed';
		messageId: string;
		toolCallId: string;
		interactive: boolean;
		savedHref: string;
		savedLabel: string;
		confirmLabel?: string;
		onResolved: (status: 'saved' | 'dismissed') => void;
	};

	let { status, messageId, toolCallId, interactive, savedHref, savedLabel, confirmLabel = 'Simpan', onResolved }: Props =
		$props();

	let pending = $state<'confirm' | 'dismiss' | null>(null);
	let error = $state('');

	const feedback = (action: 'confirm' | 'dismiss', resolved: 'saved' | 'dismissed') =>
		enhanceWithFeedback({
			onPending: (value) => (pending = value ? action : null),
			onSuccess: () => onResolved(resolved),
			onFailure: (message) => (error = message)
		});
</script>

{#if error}<FormMessage message={error} />{/if}

{#if status === 'saved'}
	<p class="flex items-center gap-2 text-sm font-medium text-dino-400">
		<Check class="size-4" aria-hidden="true" /> Tersimpan.
		<a href={savedHref} class="font-normal text-sage-300 underline hover:text-beige-100">{savedLabel}</a>
	</p>
{:else if status === 'dismissed'}
	<p class="flex items-center gap-2 text-sm text-sage-400"><X class="size-4" aria-hidden="true" /> Diabaikan.</p>
{:else if interactive}
	<div class="flex gap-2">
		<form method="POST" action="?/confirmDraft" class="flex-1" use:enhance={feedback('confirm', 'saved')}>
			<input type="hidden" name="messageId" value={messageId} />
			<input type="hidden" name="toolCallId" value={toolCallId} />
			<button
				type="submit"
				disabled={pending !== null}
				class="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-dino-400 text-sm font-semibold text-forest-950 hover:brightness-110 disabled:opacity-60"
			>
				<Check class="size-4" aria-hidden="true" />
				{pending === 'confirm' ? 'Menyimpan…' : confirmLabel}
			</button>
		</form>
		<form method="POST" action="?/dismissDraft" use:enhance={feedback('dismiss', 'dismissed')}>
			<input type="hidden" name="messageId" value={messageId} />
			<input type="hidden" name="toolCallId" value={toolCallId} />
			<button
				type="submit"
				disabled={pending !== null}
				class="flex h-11 items-center justify-center gap-2 rounded-control border border-forest-600 px-4 text-sm font-medium hover:bg-forest-800 disabled:opacity-60"
			>
				Abaikan
			</button>
		</form>
	</div>
{:else}
	<p class="text-xs text-sage-400">Menunggu jawaban selesai…</p>
{/if}

<script lang="ts">
	import { enhance } from '$app/forms';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import Dialog from './Dialog.svelte';
	import FormMessage from './FormMessage.svelte';
	import SubmitButton from './SubmitButton.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description: string;
		action: string;
		fields: Record<string, string>;
		confirmLabel?: string;
		onConfirmed?: () => void;
	};

	let {
		open = $bindable(false),
		title,
		description,
		action,
		fields,
		confirmLabel = 'Hapus',
		onConfirmed
	}: Props = $props();

	let pending = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) error = '';
	});
</script>

<Dialog bind:open {title} {description}>
	<form
		method="POST"
		{action}
		class="flex flex-col gap-4"
		use:enhance={enhanceWithFeedback({
			onPending: (value) => (pending = value),
			onSuccess: () => {
				open = false;
				onConfirmed?.();
			},
			onFailure: (message) => (error = message)
		})}
	>
		{#each Object.entries(fields) as [name, value] (name)}
			<input type="hidden" {name} {value} />
		{/each}
		{#if error}<FormMessage message={error} />{/if}
		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<button
				type="button"
				onclick={() => (open = false)}
				class="h-12 rounded-control border border-forest-600 px-5 font-medium hover:bg-forest-800"
			>
				Batal
			</button>
			<SubmitButton tone="danger" {pending}>{confirmLabel}</SubmitButton>
		</div>
	</form>
</Dialog>

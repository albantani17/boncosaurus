<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';

	type Props = { open?: boolean; title: string; description?: string; children: Snippet };

	let { open = $bindable(false), title, description, children }: Props = $props();

	let dialog: HTMLDialogElement;
	const titleId = $props.id();

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const closeOnBackdrop = (event: MouseEvent) => {
		if (event.target === dialog) open = false;
	};
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	onclose={() => (open = false)}
	onclick={closeOnBackdrop}
	class="m-auto w-[min(calc(100%-2rem),34rem)] rounded-card border border-forest-600 bg-forest-900 text-beige-100 backdrop:bg-forest-950/80
		max-md:mb-0 max-md:w-full max-md:max-w-full max-md:rounded-b-none max-md:border-b-0"
>
	<div class="flex max-h-[90dvh] flex-col gap-5 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
		<header class="flex items-start justify-between gap-4">
			<div class="flex flex-col gap-1">
				<h2 id={titleId} class="text-lg font-semibold">{title}</h2>
				{#if description}<p class="text-sm text-sage-300">{description}</p>{/if}
			</div>
			<button
				type="button"
				aria-label="Tutup"
				onclick={() => (open = false)}
				class="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
			>
				<X class="size-5" aria-hidden="true" />
			</button>
		</header>
		{#if open}
			{@render children()}
		{/if}
	</div>
</dialog>

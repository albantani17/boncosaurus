<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChatBackdrop from './ChatBackdrop.svelte';
	import ChatPanelToggle from './ChatPanelToggle.svelte';

	type Props = {
		title: string;
		actions?: Snippet;
		children: Snippet;
		footer?: Snippet;
		scroller?: HTMLElement;
	};

	let { title, actions, children, footer, scroller = $bindable() }: Props = $props();
</script>

<section
	class="relative flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-forest-950 md:h-dvh"
	aria-label={title}
>
	<ChatBackdrop />

	<header class="relative flex h-14 shrink-0 items-center gap-1 border-b border-forest-600/60 bg-forest-950/70 px-2 backdrop-blur-sm md:px-3">
		<ChatPanelToggle />
		<h1 class="min-w-0 flex-1 truncate px-1 font-semibold tracking-tight text-beige-100">{title}</h1>
		{@render actions?.()}
	</header>

	<div bind:this={scroller} class="relative min-h-0 flex-1 overflow-y-auto">
		<div class="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6">
			{@render children()}
		</div>
	</div>

	{#if footer}
		<div
			class="relative shrink-0 bg-gradient-to-t from-forest-950 via-forest-950/95 to-forest-950/0 px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-4"
		>
			<div class="mx-auto flex w-full max-w-3xl flex-col gap-2">
				{@render footer()}
			</div>
		</div>
	{/if}
</section>

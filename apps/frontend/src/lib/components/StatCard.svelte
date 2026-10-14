<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		label: string;
		value: string;
		hint?: string;
		icon: Component<{ class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
		tone?: 'neutral' | 'income' | 'expense';
	};

	let { label, value, hint, icon: Icon, tone = 'neutral' }: Props = $props();

	const toneClass = { neutral: 'text-sage-300', income: 'text-dino-400', expense: 'text-coral-400' };
</script>

<div class="flex h-full flex-col gap-2 rounded-card border border-forest-600 bg-forest-800 p-4">
	<div class="flex items-center gap-2 text-sm text-sage-300">
		<Icon class="size-4 shrink-0 {toneClass[tone]}" aria-hidden="true" />
		<span>{label}</span>
	</div>
	<p class="text-xl font-semibold tabular-nums text-beige-100 sm:text-2xl">{value}</p>
	{#if hint}
		<p class="text-xs text-sage-400">{hint}</p>
	{/if}
</div>

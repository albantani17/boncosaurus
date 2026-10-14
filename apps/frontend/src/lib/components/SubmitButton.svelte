<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		pending?: boolean;
		tone?: 'primary' | 'danger' | 'secondary';
		formaction?: string;
		children: Snippet;
	};

	let { pending = false, tone = 'primary', formaction, children }: Props = $props();

	const toneClass = {
		primary: 'bg-dino-400 text-forest-950 hover:brightness-110',
		danger: 'bg-coral-400 text-forest-950 hover:brightness-110',
		secondary: 'border border-forest-600 text-beige-100 hover:bg-forest-800'
	};
</script>

<button
	type="submit"
	{formaction}
	disabled={pending}
	class="inline-flex h-12 items-center justify-center rounded-control px-5 font-semibold disabled:cursor-wait disabled:opacity-70 {toneClass[
		tone
	]}"
>
	{#if pending}Memproses…{:else}{@render children()}{/if}
</button>

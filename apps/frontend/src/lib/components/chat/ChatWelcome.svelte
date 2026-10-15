<script lang="ts">
	import { CHAT_SUGGESTIONS } from '#lib/data/chat-tool-labels.ts';
	import DinoSprite from '../mascot/DinoSprite.svelte';

	type Props = { disabled: boolean; onPick: (suggestion: string) => void };

	let { disabled, onPick }: Props = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
	<DinoSprite state="happy" class="h-24 w-[110px]" />
	<div class="flex flex-col gap-1">
		<p class="text-lg font-semibold text-beige-100">Halo! Ada yang bisa kubantu?</p>
		<p class="max-w-md text-sm text-sage-400">
			Aku bisa membaca ringkasan, saldo, dan transaksimu, juga menyiapkan transaksi baru untuk kamu simpan.
		</p>
	</div>
	<div class="grid w-full max-w-xl gap-2 sm:grid-cols-2">
		{#each CHAT_SUGGESTIONS as suggestion (suggestion)}
			<button
				type="button"
				{disabled}
				onclick={() => onPick(suggestion)}
				class="rounded-card border border-forest-600 bg-forest-900/80 px-4 py-3 text-left text-sm text-sage-300 hover:border-dino-400 hover:text-beige-100 disabled:opacity-50"
			>
				{suggestion}
			</button>
		{/each}
	</div>
</div>

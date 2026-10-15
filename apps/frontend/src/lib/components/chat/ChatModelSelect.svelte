<script lang="ts">
	import { fieldInputClass } from '#lib/data/field-styles.ts';
	import type { AiProvider } from '#lib/types/ai.types.ts';

	type Props = { providers: AiProvider[]; value?: string };

	let { providers, value = $bindable('') }: Props = $props();
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
	{#if providers.length > 1}
		<label class="flex items-center gap-2 text-xs text-sage-400">
			Model
			<select bind:value class="{fieldInputClass(false)} h-9 max-w-xs py-0 text-xs">
				{#each providers as provider (provider.id)}
					<option value={provider.id}>{provider.name} · {provider.model}</option>
				{/each}
			</select>
		</label>
	{/if}
	<p class="text-[11px] text-sage-400">Asisten bisa keliru. Periksa lagi sebelum menyimpan transaksi.</p>
</div>

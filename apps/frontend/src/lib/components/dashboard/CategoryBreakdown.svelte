<script lang="ts">
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import type { BreakdownItem } from '#lib/domain/category/build-category-breakdown.ts';

	type Props = { items: BreakdownItem[]; currency: string };

	let { items, currency }: Props = $props();
</script>

{#if items.length === 0}
	<p class="py-6 text-center text-sm text-sage-400">Belum ada pengeluaran bulan ini.</p>
{:else}
	<ul class="flex flex-col gap-4">
		{#each items as item (item.label)}
			<li class="flex flex-col gap-1.5">
				<div class="flex items-baseline justify-between gap-3 text-sm">
					<span class="truncate text-beige-100">{item.label}</span>
					<span class="shrink-0 tabular-nums text-sage-300">
						{formatCurrency(item.total, currency)} · {item.percent}%
					</span>
				</div>
				<div
					class="h-2 overflow-hidden rounded-full bg-forest-950"
					role="meter"
					aria-label="{item.label}: {item.percent}% dari pengeluaran"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={item.percent}
				>
					<div class="h-full rounded-full bg-coral-400" style:width="{item.percent}%"></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}

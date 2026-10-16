<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import { DEBTS_HREF } from '#lib/data/nav-items.ts';
	import type { DashboardData } from '#lib/types/dashboard.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { debts: DashboardData['debts']; currency: string };

	let { debts, currency }: Props = $props();
</script>

<a
	href={DEBTS_HREF}
	class="flex items-center gap-4 rounded-card border border-forest-600 bg-forest-900 p-5 hover:bg-forest-800"
>
	<HandCoins class="size-5 shrink-0 text-sage-300" aria-hidden="true" />
	<span class="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
		<span>
			<span class="block text-xs text-sage-400">Hutangku</span>
			<span class="block font-semibold tabular-nums text-coral-400">{formatCurrency(debts.payable, currency)}</span>
		</span>
		<span>
			<span class="block text-xs text-sage-400">Piutangku</span>
			<span class="block font-semibold tabular-nums text-dino-400">{formatCurrency(debts.receivable, currency)}</span>
		</span>
		<span class="col-span-2 sm:col-span-1">
			<span class="block text-xs text-sage-400">Hutang & piutang berjalan</span>
			<span class="block text-sm">
				{debts.activeCount} catatan{#if debts.overdueCount > 0}<span class="text-amber-400"> · {debts.overdueCount} telat</span>{/if}
			</span>
		</span>
	</span>
	<ChevronRight class="size-5 shrink-0 text-sage-400" aria-hidden="true" />
</a>

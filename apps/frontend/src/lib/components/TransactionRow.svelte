<script lang="ts">
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import type { TransactionRowData } from '#lib/types/transaction-row.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { row: TransactionRowData; meta: string; onselect?: () => void };

	let { row, meta, onselect }: Props = $props();

	const display = $derived(TRANSACTION_TYPE_DISPLAY[row.type]);
	const description = $derived(row.note || row.categoryName || display.label);
	const amountText = $derived(`${display.sign}${formatCurrency(row.amount, row.currency)}`);
	const receivedText = $derived(
		row.type === 'transfer' && row.toAmount !== null && row.toCurrency
			? `→ ${formatCurrency(row.toAmount, row.toCurrency)}`
			: ''
	);
</script>

{#snippet content()}
	<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-950 {display.textClass}">
		<display.icon class="size-4" aria-hidden="true" />
	</span>
	<span class="min-w-0 flex-1">
		<span class="block truncate text-sm text-beige-100">{description}</span>
		<span class="block truncate text-xs text-sage-400"><span class="sr-only">{display.label}, </span>{meta}</span>
	</span>
	<span class="shrink-0 text-right">
		<span class="block text-sm font-medium tabular-nums {display.textClass}">{amountText}</span>
		{#if receivedText}<span class="block text-xs tabular-nums text-sage-400">{receivedText}</span>{/if}
	</span>
{/snippet}

{#if onselect}
	<button
		type="button"
		onclick={onselect}
		class="-mx-2 flex min-h-16 w-[calc(100%+1rem)] items-center gap-3 rounded-control px-2 py-3 text-left hover:bg-forest-800"
	>
		{@render content()}
	</button>
{:else}
	<div class="flex min-h-16 items-center gap-3 py-3">
		{@render content()}
	</div>
{/if}

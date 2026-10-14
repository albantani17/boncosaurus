<script lang="ts">
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import type { RecentTransaction } from '#lib/types/dashboard.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { transactions: RecentTransaction[] };

	let { transactions }: Props = $props();

	const describe = (transaction: RecentTransaction) =>
		transaction.note || transaction.categoryName || TRANSACTION_TYPE_DISPLAY[transaction.type].label;
	const amountText = (transaction: RecentTransaction) =>
		`${TRANSACTION_TYPE_DISPLAY[transaction.type].sign}${formatCurrency(transaction.amount, transaction.currency)}`;
</script>

<table class="hidden w-full text-sm md:table">
	<caption class="sr-only">Transaksi terbaru</caption>
	<thead>
		<tr class="border-b border-forest-600 text-left text-xs text-sage-400">
			<th scope="col" class="pb-2 font-medium">Tanggal</th>
			<th scope="col" class="pb-2 font-medium">Keterangan</th>
			<th scope="col" class="pb-2 font-medium">Akun</th>
			<th scope="col" class="pb-2 font-medium">Jenis</th>
			<th scope="col" class="pb-2 text-right font-medium">Jumlah</th>
		</tr>
	</thead>
	<tbody class="divide-y divide-forest-600">
		{#each transactions as transaction (transaction.id)}
			{@const display = TRANSACTION_TYPE_DISPLAY[transaction.type]}
			<tr>
				<td class="py-3 pr-3 whitespace-nowrap text-sage-300">{transaction.dateLabel}</td>
				<td class="py-3 pr-3 text-beige-100">
					{describe(transaction)}
					{#if transaction.categoryName && transaction.note}
						<span class="block text-xs text-sage-400">{transaction.categoryName}</span>
					{/if}
				</td>
				<td class="py-3 pr-3 text-sage-300">{transaction.accountName}</td>
				<td class="py-3 pr-3">
					<span class="inline-flex items-center gap-1.5 {display.textClass}">
						<display.icon class="size-4" aria-hidden="true" />
						{display.label}
					</span>
				</td>
				<td class="py-3 text-right font-medium tabular-nums whitespace-nowrap {display.textClass}">
					{amountText(transaction)}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<ul class="flex flex-col divide-y divide-forest-600 md:hidden">
	{#each transactions as transaction (transaction.id)}
		{@const display = TRANSACTION_TYPE_DISPLAY[transaction.type]}
		<li class="flex min-h-16 items-center gap-3 py-3 first:pt-0 last:pb-0">
			<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-950 {display.textClass}">
				<display.icon class="size-4" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm text-beige-100">{describe(transaction)}</p>
				<p class="truncate text-xs text-sage-400">
					<span class="sr-only">{display.label}, </span>{transaction.accountName} · {transaction.dateLabel}
				</p>
			</div>
			<p class="shrink-0 text-sm font-medium tabular-nums {display.textClass}">
				{amountText(transaction)}
			</p>
		</li>
	{/each}
</ul>

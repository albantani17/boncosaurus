<script lang="ts">
	import { DEBT_SOURCE_LABELS, DEBT_STATUS_LABELS } from '#lib/data/debt-labels.ts';
	import type { Debt } from '#lib/types/api.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { formatDueDate } from '#lib/domain/debt/format-due-date.ts';
	import DebtProgress from './DebtProgress.svelte';

	type Props = { debt: Debt; today: string };

	let { debt, today }: Props = $props();

	const isActive = $derived(debt.status === 'active');
	const dueText = $derived(debt.position.nextDueDate ? formatDueDate(debt.position.nextDueDate, today) : '');
	const amountText = $derived(
		isActive ? formatCurrency(debt.position.remaining, debt.currency) : formatCurrency(debt.position.paid, debt.currency)
	);
</script>

<a href="/hutang/{debt.id}" class="flex flex-col gap-2 rounded-control px-2 py-3 hover:bg-forest-800">
	<span class="flex items-start justify-between gap-3">
		<span class="min-w-0">
			<span class="block truncate text-sm font-medium text-beige-100">{debt.title}</span>
			<span class="block truncate text-xs text-sage-400">
				{DEBT_SOURCE_LABELS[debt.sourceType]}
				{#if debt.installmentCount > 0}· {debt.installmentCount}× cicilan{/if}
				{#if !isActive}· {DEBT_STATUS_LABELS[debt.status]}{/if}
			</span>
		</span>
		<span class="shrink-0 text-right">
			<span class="block text-sm font-semibold tabular-nums">{amountText}</span>
			{#if isActive && dueText}
				<span class="block text-xs {debt.position.isOverdue ? 'text-amber-400' : 'text-sage-400'}">{dueText}</span>
			{:else if isActive}
				<span class="block text-xs text-sage-400">sisa</span>
			{/if}
		</span>
	</span>
	{#if isActive}
		<DebtProgress paid={debt.position.paid} totalDue={debt.position.totalDue} direction={debt.direction} />
	{/if}
</a>

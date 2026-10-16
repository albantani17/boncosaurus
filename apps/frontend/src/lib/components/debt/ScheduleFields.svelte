<script lang="ts">
	import { FIELD_HINT_CLASS } from '#lib/data/field-styles.ts';
	import { summarizeSchedule } from '#lib/domain/debt/summarize-schedule.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { parseAmountInput } from '#lib/utils/parse-amount-input.ts';
	import AmountField from '../ui/AmountField.svelte';
	import TextField from '../ui/TextField.svelte';

	type Props = {
		enabled?: boolean;
		firstDueDate?: string;
		count?: string;
		installmentAmount?: string;
		principal: string;
		currency: string;
	};

	let {
		enabled = $bindable(false),
		firstDueDate = $bindable(''),
		count = $bindable('3'),
		installmentAmount = $bindable(''),
		principal,
		currency
	}: Props = $props();

	const summary = $derived(
		summarizeSchedule(
			parseAmountInput(principal) ?? 0,
			Number(count),
			installmentAmount ? parseAmountInput(installmentAmount) : null
		)
	);
</script>

<fieldset class="flex flex-col gap-4 rounded-control border border-forest-600 p-4">
	<legend class="px-1 text-sm font-medium text-sage-300">Cicilan</legend>
	<label class="flex min-h-11 items-center gap-3 text-sm">
		<input type="checkbox" name="withSchedule" bind:checked={enabled} class="size-5 accent-dino-400" />
		Bayar dengan jadwal cicilan bulanan
	</label>

	{#if enabled}
		<div class="grid gap-4 sm:grid-cols-2">
			<TextField label="Jatuh tempo pertama" name="firstDueDate" type="date" bind:value={firstDueDate} />
			<TextField label="Jumlah cicilan" name="installmentCount" bind:value={count} inputmode="numeric" maxlength={3} autocomplete="off" />
		</div>
		<AmountField label="Nominal per cicilan" name="installmentAmount" bind:value={installmentAmount} {currency} required={false} />
		{#if summary}
			<p class={FIELD_HINT_CLASS}>
				{count}× {formatCurrency(summary.perInstallment, currency)} = {formatCurrency(summary.total, currency)}
				{#if summary.interest > 0}
					· termasuk bunga/biaya {formatCurrency(summary.interest, currency)}
				{:else if !installmentAmount}
					· pokok dibagi rata
				{/if}
			</p>
		{/if}
	{/if}
</fieldset>

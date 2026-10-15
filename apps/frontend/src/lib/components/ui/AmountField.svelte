<script lang="ts">
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { parseAmountInput } from '#lib/utils/parse-amount-input.ts';
	import TextField from './TextField.svelte';

	type Props = {
		label: string;
		name: string;
		id?: string;
		value?: string;
		currency: string;
		required?: boolean;
		allowNegative?: boolean;
	};

	let { label, name, id = name, value = $bindable(''), currency, required = true, allowNegative = false }: Props = $props();

	const preview = $derived.by(() => {
		const amount = parseAmountInput(value, { allowZero: true, allowNegative });
		return amount === null ? undefined : `= ${formatCurrency(amount, currency)}`;
	});
</script>

<TextField
	{label}
	{name}
	{id}
	bind:value
	{required}
	inputmode={allowNegative ? 'text' : 'numeric'}
	autocomplete="off"
	placeholder="0"
	hint={preview ?? 'Angka bulat tanpa koma, misalnya 150000'}
/>

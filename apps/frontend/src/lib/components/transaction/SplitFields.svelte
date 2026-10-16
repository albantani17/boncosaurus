<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { FIELD_HINT_CLASS, fieldInputClass } from '#lib/data/field-styles.ts';
	import type { Counterparty } from '#lib/types/api.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { parseAmountInput } from '#lib/utils/parse-amount-input.ts';

	type Props = { amount: string; currency: string; counterparties: Counterparty[] };

	let { amount, currency, counterparties }: Props = $props();

	let rows = $state<{ key: number; name: string; amount: string }[]>([]);
	let nextKey = 0;

	const total = $derived(parseAmountInput(amount) ?? 0);
	const othersTotal = $derived(rows.reduce((sum, row) => sum + (parseAmountInput(row.amount) ?? 0), 0));
	const myShare = $derived(total - othersTotal);

	const addRow = () => rows.push({ key: nextKey++, name: '', amount: '' });
	const removeRow = (key: number) => (rows = rows.filter((row) => row.key !== key));
</script>

<fieldset class="flex flex-col gap-3 rounded-control border border-forest-600 p-4">
	<legend class="px-1 text-sm font-medium text-sage-300">Ada bagian orang lain?</legend>
	{#if rows.length === 0}
		<p class={FIELD_HINT_CLASS}>Kalau kamu menalangi teman, catat bagiannya sebagai piutang. Laporan hanya menghitung bagianmu.</p>
	{/if}

	{#each rows as row, index (row.key)}
		<div class="flex items-center gap-2">
			<label class="sr-only" for="split-name-{row.key}">Nama orang {index + 1}</label>
			<input
				id="split-name-{row.key}"
				name="splitName"
				bind:value={row.name}
				list="split-counterparties"
				placeholder="Nama"
				autocomplete="off"
				maxlength={100}
				class="{fieldInputClass(false)} min-w-0 flex-[3]"
			/>
			<label class="sr-only" for="split-amount-{row.key}">Bagian orang {index + 1}</label>
			<input
				id="split-amount-{row.key}"
				name="splitAmount"
				bind:value={row.amount}
				inputmode="numeric"
				placeholder="0"
				autocomplete="off"
				class="{fieldInputClass(false)} min-w-0 flex-[2]"
			/>
			<button
				type="button"
				aria-label="Hapus baris {index + 1}"
				onclick={() => removeRow(row.key)}
				class="flex size-11 shrink-0 items-center justify-center rounded-control text-sage-400 hover:bg-forest-800"
			>
				<X class="size-4" aria-hidden="true" />
			</button>
		</div>
	{/each}
	<datalist id="split-counterparties">
		{#each counterparties.filter((counterparty) => !counterparty.isArchived) as counterparty (counterparty.id)}
			<option value={counterparty.name}></option>
		{/each}
	</datalist>

	{#if rows.length > 0}
		<p class="{FIELD_HINT_CLASS} {myShare < 0 ? 'text-coral-400' : ''}">
			Bagianku {formatCurrency(myShare, currency)} · piutang {formatCurrency(othersTotal, currency)}
		</p>
	{/if}
	<button
		type="button"
		onclick={addRow}
		class="inline-flex h-11 w-fit items-center gap-2 rounded-control border border-forest-600 px-3 text-sm font-medium hover:bg-forest-800"
	>
		<Plus class="size-4" aria-hidden="true" /> Tambah orang
	</button>
</fieldset>

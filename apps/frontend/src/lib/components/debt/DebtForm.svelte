<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { DEBT_PRESETS, type DebtMoneyFlow } from '#lib/data/debt-presets.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Account, Category, Counterparty, DebtDirection } from '#lib/types/api.types.ts';
	import { buildCategoryTree } from '#lib/domain/category/build-category-tree.ts';
	import { toDatetimeInputValue } from '#lib/utils/local-datetime.ts';
	import { toDateInputValue } from '#lib/utils/to-date-input-value.ts';
	import AmountField from '../ui/AmountField.svelte';
	import FormMessage from '../ui/FormMessage.svelte';
	import SelectField from '../ui/SelectField.svelte';
	import SubmitButton from '../ui/SubmitButton.svelte';
	import TextField from '../ui/TextField.svelte';
	import ScheduleFields from './ScheduleFields.svelte';

	type Props = {
		direction: DebtDirection;
		accounts: Account[];
		categories: Category[];
		counterparties: Counterparty[];
		baseCurrency: string;
		onDone: () => void;
	};

	let { direction: initialDirection, accounts, categories, counterparties, baseCurrency, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the props are only read once.
	const startDirection = untrack(() => initialDirection);
	const firstPreset = DEBT_PRESETS.find((preset) => preset.direction === startDirection)!;
	const defaultCurrency = untrack(() => baseCurrency);
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);

	let presetKey = $state(firstPreset.key);
	let moneyFlow = $state<DebtMoneyFlow>(firstPreset.moneyFlow);
	let withSchedule = $state(firstPreset.withSchedule);
	let reminderDays = $state(String(firstPreset.reminderDays));
	let counterpartyName = $state('');
	let title = $state('');
	let principal = $state('');
	let accountId = $state(untrack(() => accounts.find((account) => !account.isArchived)?.id ?? ''));
	let categoryId = $state('');
	let currency = $state(defaultCurrency);
	let originatedAt = $state(toDatetimeInputValue(new Date(), new Date().getTimezoneOffset()));
	let dueDate = $state('');
	let firstDueDate = $state(toDateInputValue(nextMonth));
	let installmentCount = $state('3');
	let installmentAmount = $state('');
	let note = $state('');
	let pending = $state(false);
	let error = $state('');

	const preset = $derived(DEBT_PRESETS.find((option) => option.key === presetKey) ?? firstPreset);
	const isPersonal = $derived(preset.sourceType === 'personal');
	const accountOptions = $derived(
		accounts
			.filter((account) => !account.isArchived)
			.map((account) => ({ value: account.id, label: `${account.name} (${account.currency})` }))
	);
	const categoryOptions = $derived(
		buildCategoryTree(
			categories.filter((category) => !category.isArchived),
			'expense'
		).flatMap((node) => [
			{ value: node.category.id, label: node.category.name },
			...node.children.map((child) => ({ value: child.id, label: `${node.category.name} › ${child.name}` }))
		])
	);
	const amountCurrency = $derived(
		moneyFlow === 'cash'
			? (accounts.find((account) => account.id === accountId)?.currency ?? defaultCurrency)
			: currency.toUpperCase() || defaultCurrency
	);
	const counterpartyLabel = $derived(isPersonal ? 'Nama orang' : 'Nama produk / penyedia');
	const cashLabel = $derived(preset.direction === 'payable' ? 'Uang masuk ke akun' : 'Uang keluar dari akun');

	const selectPreset = (key: string) => {
		const next = DEBT_PRESETS.find((option) => option.key === key)!;
		presetKey = key;
		moneyFlow = next.moneyFlow;
		withSchedule = next.withSchedule;
		reminderDays = String(next.reminderDays);
	};
</script>

<form
	method="POST"
	action="?/create"
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		prepare: (formData) => formData.set('tzOffset', String(new Date().getTimezoneOffset())),
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if error}<FormMessage message={error} />{/if}
	<input type="hidden" name="direction" value={preset.direction} />
	<input type="hidden" name="sourceType" value={preset.sourceType} />
	<input type="hidden" name="moneyFlow" value={moneyFlow} />

	<fieldset class="flex flex-col gap-1.5">
		<legend class="mb-1.5 text-sm font-medium text-sage-300">Jenis</legend>
		<div class="flex flex-wrap gap-2">
			{#each DEBT_PRESETS as option (option.key)}
				<label
					class="flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-dino-400
						{presetKey === option.key
						? 'border-dino-400 bg-forest-700 text-beige-100'
						: 'border-forest-600 text-sage-300 hover:bg-forest-800'}"
				>
					<input
						type="radio"
						name="preset"
						value={option.key}
						checked={presetKey === option.key}
						onchange={() => selectPreset(option.key)}
						class="sr-only"
					/>
					{option.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="flex flex-col gap-1.5">
		<TextField
			label={counterpartyLabel}
			name="counterpartyName"
			bind:value={counterpartyName}
			maxlength={100}
			autocomplete="off"
			list="counterparty-names"
			hint="Pilih yang sudah ada atau ketik nama baru."
		/>
		<datalist id="counterparty-names">
			{#each counterparties.filter((counterparty) => !counterparty.isArchived) as counterparty (counterparty.id)}
				<option value={counterparty.name}></option>
			{/each}
		</datalist>
	</div>

	<TextField label="Untuk apa" name="title" bind:value={title} maxlength={120} required={false} autocomplete="off" />
	<AmountField
		label={moneyFlow === 'purchase' ? 'Harga / pokok' : 'Jumlah pinjaman'}
		name="principal"
		bind:value={principal}
		currency={amountCurrency}
	/>

	{#if isPersonal && preset.direction === 'payable'}
		<fieldset class="grid grid-cols-2 gap-1 rounded-control border border-forest-600 bg-forest-950 p-1">
			<legend class="sr-only">Bagaimana uangnya</legend>
			{#each [{ value: 'cash', label: 'Uang masuk ke akun' }, { value: 'purchase', label: 'Dibayarin langsung' }] as option (option.value)}
				<label
					class="flex h-10 cursor-pointer items-center justify-center rounded-[8px] text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-dino-400
						{moneyFlow === option.value ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'}"
				>
					<input
						type="radio"
						name="moneyFlowChoice"
						value={option.value}
						checked={moneyFlow === option.value}
						onchange={() => (moneyFlow = option.value as DebtMoneyFlow)}
						class="sr-only"
					/>
					{option.label}
				</label>
			{/each}
		</fieldset>
	{/if}

	{#if moneyFlow === 'cash'}
		<SelectField label={cashLabel} name="accountId" bind:value={accountId} options={accountOptions} />
	{:else}
		<SelectField
			label="Kategori belanja"
			name="categoryId"
			bind:value={categoryId}
			options={categoryOptions}
			emptyLabel="Pilih kategori"
			hint="Belanjanya masuk laporan pengeluaran sekarang; saldo baru berkurang saat kamu membayar."
		/>
		<TextField label="Mata uang" name="currency" bind:value={currency} maxlength={3} autocomplete="off" />
	{/if}

	<TextField label="Tanggal" name="originatedAt" type="datetime-local" bind:value={originatedAt} />

	<ScheduleFields
		bind:enabled={withSchedule}
		bind:firstDueDate
		bind:count={installmentCount}
		bind:installmentAmount
		{principal}
		currency={amountCurrency}
	/>
	{#if !withSchedule}
		<TextField label="Jatuh tempo" name="dueDate" type="date" bind:value={dueDate} required={false} />
	{/if}

	<TextField
		label="Ingatkan (hari sebelum jatuh tempo)"
		name="reminderDays"
		bind:value={reminderDays}
		inputmode="numeric"
		maxlength={2}
		autocomplete="off"
		hint="0 berarti diingatkan pada hari jatuh temponya."
	/>

	<TextField label="Catatan" name="note" bind:value={note} maxlength={500} required={false} autocomplete="off" />

	<SubmitButton {pending}>Simpan</SubmitButton>
</form>

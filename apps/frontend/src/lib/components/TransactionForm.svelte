<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Account, Category, TransactionType } from '#lib/types/api.types.ts';
	import type { TransactionRowData } from '#lib/types/transaction-row.types.ts';
	import { buildCategoryTree } from '#lib/utils/build-category-tree.ts';
	import { toDatetimeInputValue } from '#lib/utils/local-datetime.ts';
	import AmountField from './AmountField.svelte';
	import FormMessage from './FormMessage.svelte';
	import SelectField from './SelectField.svelte';
	import SubmitButton from './SubmitButton.svelte';
	import TextField from './TextField.svelte';

	type Props = { row?: TransactionRowData; accounts: Account[]; categories: Category[]; onDone: () => void };

	let { row, accounts, categories, onDone }: Props = $props();

	const TYPES: TransactionType[] = ['expense', 'income', 'transfer'];

	// The dialog mounts a fresh form each time it opens, so the row is only read once.
	const initial = untrack(() => row);
	const firstActiveAccount = untrack(() => accounts.find((account) => !account.isArchived)?.id ?? '');
	let type = $state<TransactionType>(initial?.type ?? 'expense');
	let accountId = $state(initial?.accountId ?? firstActiveAccount);
	let toAccountId = $state(initial?.toAccountId ?? '');
	let categoryId = $state(initial?.categoryId ?? '');
	let amount = $state(initial ? String(initial.amount) : '');
	let toAmount = $state(initial?.toAmount ? String(initial.toAmount) : '');
	let fee = $state(initial?.fee ? String(initial.fee) : '');
	let occurredAt = $state(
		toDatetimeInputValue(initial ? new Date(initial.occurredAt) : new Date(), new Date().getTimezoneOffset())
	);
	let note = $state(initial?.note ?? '');
	let pending = $state(false);
	let error = $state('');

	const isTransfer = $derived(type === 'transfer');
	const keepIds = new Set([initial?.accountId, initial?.toAccountId, initial?.categoryId].filter(Boolean));
	const selectableAccounts = $derived(accounts.filter((account) => !account.isArchived || keepIds.has(account.id)));
	const accountOptions = $derived(
		selectableAccounts.map((account) => ({ value: account.id, label: `${account.name} (${account.currency})` }))
	);
	const categoryOptions = $derived(
		type === 'transfer'
			? []
			: buildCategoryTree(
					categories.filter((category) => !category.isArchived || keepIds.has(category.id)),
					type
				).flatMap((node) => [
					{ value: node.category.id, label: node.category.name },
					...node.children.map((child) => ({ value: child.id, label: `${node.category.name} › ${child.name}` }))
				])
	);
	const fromCurrency = $derived(accounts.find((account) => account.id === accountId)?.currency ?? 'IDR');
	const toCurrency = $derived(accounts.find((account) => account.id === toAccountId)?.currency);
	const needsReceivedAmount = $derived(isTransfer && toCurrency !== undefined && toCurrency !== fromCurrency);

	const selectType = (next: TransactionType) => {
		type = next;
		if (!categoryOptions.some((option) => option.value === categoryId)) categoryId = '';
	};
</script>

<form
	method="POST"
	action={initial ? '?/update' : '?/create'}
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		prepare: (formData) => formData.set('tzOffset', String(new Date().getTimezoneOffset())),
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if initial}<input type="hidden" name="id" value={initial.id} />{/if}
	{#if error}<FormMessage message={error} />{/if}

	<fieldset class="flex flex-col gap-1.5">
		<legend class="mb-1.5 text-sm font-medium text-sage-300">Jenis</legend>
		<div class="grid grid-cols-3 gap-1 rounded-control border border-forest-600 bg-forest-950 p-1">
			{#each TYPES as option (option)}
				{@const display = TRANSACTION_TYPE_DISPLAY[option]}
				<label
					class="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-dino-400
						{type === option ? `bg-forest-700 ${display.textClass}` : 'text-sage-300 hover:bg-forest-800'}"
				>
					<input
						type="radio"
						name="type"
						value={option}
						checked={type === option}
						onchange={() => selectType(option)}
						class="sr-only"
					/>
					<display.icon class="size-4" aria-hidden="true" />
					{display.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<AmountField label={isTransfer ? 'Jumlah dikirim' : 'Jumlah'} name="amount" bind:value={amount} currency={fromCurrency} />

	<SelectField label={isTransfer ? 'Dari akun' : 'Akun'} name="accountId" bind:value={accountId} options={accountOptions} />

	{#if isTransfer}
		<SelectField
			label="Ke akun"
			name="toAccountId"
			bind:value={toAccountId}
			options={accountOptions.filter((option) => option.value !== accountId)}
			emptyLabel="Pilih akun tujuan"
		/>
		{#if needsReceivedAmount && toCurrency}
			<AmountField label="Jumlah diterima" name="toAmount" bind:value={toAmount} currency={toCurrency} />
		{/if}
		<AmountField label="Biaya admin" name="fee" bind:value={fee} currency={fromCurrency} required={false} />
	{:else}
		<SelectField
			label="Kategori"
			name="categoryId"
			bind:value={categoryId}
			options={categoryOptions}
			emptyLabel="Tanpa kategori"
			required={false}
		/>
	{/if}

	<TextField label="Tanggal & waktu" name="occurredAt" type="datetime-local" bind:value={occurredAt} />
	<TextField label="Catatan" name="note" bind:value={note} maxlength={500} required={false} autocomplete="off" />

	<SubmitButton {pending}>{initial ? 'Simpan perubahan' : 'Simpan transaksi'}</SubmitButton>
</form>

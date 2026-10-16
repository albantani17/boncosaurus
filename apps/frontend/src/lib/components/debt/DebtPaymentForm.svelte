<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { FIELD_HINT_CLASS } from '#lib/data/field-styles.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Account, Category, DebtDetail } from '#lib/types/api.types.ts';
	import { pickChargeCategory } from '#lib/domain/debt/pick-charge-category.ts';
	import { previewPaymentSplit } from '#lib/domain/debt/preview-payment-split.ts';
	import { suggestPaymentAmount } from '#lib/domain/debt/suggest-payment-amount.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { toDatetimeInputValue } from '#lib/utils/local-datetime.ts';
	import { parseAmountInput } from '#lib/utils/parse-amount-input.ts';
	import AmountField from '../ui/AmountField.svelte';
	import FormMessage from '../ui/FormMessage.svelte';
	import SelectField from '../ui/SelectField.svelte';
	import SubmitButton from '../ui/SubmitButton.svelte';
	import TextField from '../ui/TextField.svelte';

	type Props = { debt: DebtDetail; accounts: Account[]; categories: Category[]; onDone: () => void };

	let { debt, accounts, categories, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the props are only read once.
	const initial = untrack(() => debt);
	const chargeType = initial.direction === 'payable' ? 'expense' : 'income';
	const sameCurrencyAccounts = untrack(() =>
		accounts.filter((account) => !account.isArchived && account.currency === initial.currency)
	);
	const chargeCategories = untrack(() => categories.filter((category) => !category.isArchived && category.type === chargeType));

	let accountId = $state(
		sameCurrencyAccounts.find((account) => account.id === initial.accountId)?.id ?? sameCurrencyAccounts[0]?.id ?? ''
	);
	let amount = $state(String(suggestPaymentAmount(initial) || ''));
	let paidAt = $state(toDatetimeInputValue(new Date(), new Date().getTimezoneOffset()));
	let extraCategoryId = $state(pickChargeCategory(chargeCategories, chargeType)?.id ?? '');
	let note = $state('');
	let pending = $state(false);
	let error = $state('');

	const split = $derived(previewPaymentSplit(parseAmountInput(amount) ?? 0, initial.position.principalRemaining));
	const accountLabel = initial.direction === 'payable' ? 'Bayar dari akun' : 'Masuk ke akun';
	const extraLabel = initial.direction === 'payable' ? 'Kategori bunga/biaya' : 'Kategori kelebihan bayar';
</script>

<form
	method="POST"
	action="?/pay"
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		prepare: (formData) => formData.set('tzOffset', String(new Date().getTimezoneOffset())),
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if error}<FormMessage message={error} />{/if}
	{#if sameCurrencyAccounts.length === 0}
		<FormMessage message="Belum ada akun aktif dengan mata uang {initial.currency}." />
	{/if}

	<AmountField label="Jumlah dibayar" name="amount" bind:value={amount} currency={initial.currency} />
	<p class={FIELD_HINT_CLASS}>
		Sisa {formatCurrency(initial.position.remaining, initial.currency)} · pokok {formatCurrency(
			initial.position.principalRemaining,
			initial.currency
		)}
	</p>

	<SelectField
		label={accountLabel}
		name="accountId"
		bind:value={accountId}
		options={sameCurrencyAccounts.map((account) => ({ value: account.id, label: account.name }))}
	/>

	{#if split.extraAmount > 0}
		<div class="flex flex-col gap-3 rounded-control border border-amber-400/60 bg-forest-950 p-3">
			<p class="text-sm text-beige-100">
				{formatCurrency(split.principalAmount, initial.currency)} untuk pokok +
				<span class="font-semibold text-amber-400">{formatCurrency(split.extraAmount, initial.currency)}</span>
				{initial.direction === 'payable' ? 'bunga/biaya (pengeluaran)' : 'kelebihan bayar (pemasukan)'}.
			</p>
			<SelectField
				label={extraLabel}
				name="extraCategoryId"
				bind:value={extraCategoryId}
				options={chargeCategories.map((category) => ({ value: category.id, label: category.name }))}
				emptyLabel="Tanpa kategori"
				required={false}
			/>
		</div>
	{/if}

	<TextField label="Tanggal bayar" name="paidAt" type="datetime-local" bind:value={paidAt} />
	<TextField label="Catatan" name="note" bind:value={note} maxlength={500} required={false} autocomplete="off" />

	<SubmitButton {pending}>Catat pembayaran</SubmitButton>
</form>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { ACCOUNT_TYPE_LABELS } from '#lib/data/account-type-labels.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Account } from '#lib/types/api.types.ts';
	import { ACCOUNT_TYPES } from '#lib/domain/account/parse-account-form.ts';
	import AmountField from '../ui/AmountField.svelte';
	import FormMessage from '../ui/FormMessage.svelte';
	import SelectField from '../ui/SelectField.svelte';
	import SubmitButton from '../ui/SubmitButton.svelte';
	import TextField from '../ui/TextField.svelte';

	type Props = { account?: Account; baseCurrency: string; onDone: () => void };

	let { account, baseCurrency, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the props are only read once.
	const initial = untrack(() => account);
	const defaultCurrency = untrack(() => baseCurrency);
	let name = $state(initial?.name ?? '');
	let type = $state<string>(initial?.type ?? 'bank');
	let currency = $state(initial?.currency ?? defaultCurrency);
	let initialBalance = $state(String(initial?.initialBalance ?? ''));
	let pending = $state(false);
	let error = $state('');

	const typeOptions = ACCOUNT_TYPES.map((value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }));
</script>

<form
	method="POST"
	action={initial ? '?/update' : '?/create'}
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if initial}<input type="hidden" name="id" value={initial.id} />{/if}
	{#if error}<FormMessage message={error} />{/if}

	<TextField label="Nama akun" name="name" bind:value={name} maxlength={100} autocomplete="off" />
	<SelectField label="Jenis" name="type" bind:value={type} options={typeOptions} />
	<TextField
		label="Mata uang"
		name="currency"
		bind:value={currency}
		maxlength={3}
		autocomplete="off"
		hint="Kode 3 huruf, misalnya IDR atau USD. Tidak bisa diubah kalau akun sudah punya transaksi."
	/>
	<AmountField
		label="Saldo awal"
		name="initialBalance"
		bind:value={initialBalance}
		currency={currency.toUpperCase() || defaultCurrency}
		required={false}
		allowNegative
	/>

	<SubmitButton {pending}>{initial ? 'Simpan perubahan' : 'Tambah akun'}</SubmitButton>
</form>

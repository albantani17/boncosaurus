<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { DebtDetail } from '#lib/types/api.types.ts';
	import { toScheduleFormValues } from '#lib/domain/debt/to-schedule-form-values.ts';
	import AmountField from '../ui/AmountField.svelte';
	import FormMessage from '../ui/FormMessage.svelte';
	import SubmitButton from '../ui/SubmitButton.svelte';
	import TextField from '../ui/TextField.svelte';
	import ScheduleFields from './ScheduleFields.svelte';

	type Props = { debt: DebtDetail; onDone: () => void };

	let { debt, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the debt is only read once.
	const initial = untrack(() => debt);
	const schedule = toScheduleFormValues(initial.installments);
	const hasPayments = initial.payments.length > 0;

	let title = $state(initial.title);
	let principal = $state(String(initial.principal));
	let dueDate = $state(initial.installmentCount > 0 ? '' : (initial.dueDate ?? ''));
	let withSchedule = $state(schedule.enabled);
	let firstDueDate = $state(schedule.firstDueDate);
	let installmentCount = $state(schedule.count);
	let installmentAmount = $state(schedule.installmentAmount);
	let reminderDays = $state(String(initial.reminderDays));
	let note = $state(initial.note ?? '');
	let pending = $state(false);
	let error = $state('');
</script>

<form
	method="POST"
	action="?/update"
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if error}<FormMessage message={error} />{/if}

	<TextField label="Untuk apa" name="title" bind:value={title} maxlength={120} autocomplete="off" />
	{#if hasPayments}
		<input type="hidden" name="principal" value={initial.principal} />
		<p class="text-sm text-sage-400">Pokok tidak bisa diubah karena sudah ada pembayaran. Hapus pembayarannya dulu kalau salah catat.</p>
	{:else}
		<AmountField label="Jumlah pokok" name="principal" bind:value={principal} currency={initial.currency} />
	{/if}

	<ScheduleFields
		bind:enabled={withSchedule}
		bind:firstDueDate
		bind:count={installmentCount}
		bind:installmentAmount
		{principal}
		currency={initial.currency}
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

	<SubmitButton {pending}>Simpan perubahan</SubmitButton>
</form>

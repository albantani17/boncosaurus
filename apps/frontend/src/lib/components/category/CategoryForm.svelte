<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { CATEGORY_TYPE_LABELS } from '#lib/data/category-type-labels.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Category, CategoryType } from '#lib/types/api.types.ts';
	import FormMessage from '../ui/FormMessage.svelte';
	import SelectField from '../ui/SelectField.svelte';
	import SubmitButton from '../ui/SubmitButton.svelte';
	import TextField from '../ui/TextField.svelte';

	type Props = {
		category?: Category;
		type: CategoryType;
		parentId?: string;
		parentOptions: Category[];
		onDone: () => void;
	};

	let { category, type, parentId, parentOptions, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the props are only read once.
	const initial = untrack(() => ({ category, type, parentId: parentId ?? '' }));
	let name = $state(initial.category?.name ?? '');
	let selectedParent = $state(initial.parentId);
	let pending = $state(false);
	let error = $state('');

	const options = $derived(
		parentOptions
			.filter((option) => option.type === initial.type && !option.parentId && !option.isArchived)
			.map((option) => ({ value: option.id, label: option.name }))
	);
</script>

<form
	method="POST"
	action={initial.category ? '?/update' : '?/create'}
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if initial.category}<input type="hidden" name="id" value={initial.category.id} />{/if}
	<input type="hidden" name="type" value={initial.type} />
	{#if error}<FormMessage message={error} />{/if}

	<TextField label="Nama kategori" name="name" bind:value={name} maxlength={100} autocomplete="off" />

	{#if initial.category}
		<p class="text-sm text-sage-300">Jenis: {CATEGORY_TYPE_LABELS[initial.type]}</p>
	{:else}
		<SelectField
			label="Kategori induk"
			name="parentId"
			bind:value={selectedParent}
			options={options}
			emptyLabel="Tidak ada (kategori utama)"
			required={false}
			hint="Jenis: {CATEGORY_TYPE_LABELS[initial.type]}. Subkategori hanya satu tingkat."
		/>
	{/if}

	<SubmitButton {pending}>{initial.category ? 'Simpan perubahan' : 'Tambah kategori'}</SubmitButton>
</form>

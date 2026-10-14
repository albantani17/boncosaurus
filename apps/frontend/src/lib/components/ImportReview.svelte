<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import { fieldInputClass } from '#lib/data/field-styles.ts';
	import type { Account, Category } from '#lib/types/api.types.ts';
	import type { ImportPreview } from '#lib/types/import.types.ts';
	import { buildCommitPayload } from '#lib/utils/build-commit-payload.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { preview: ImportPreview; accounts: Account[]; categories: Category[]; currency: string };

	let { preview, accounts, categories, currency }: Props = $props();

	// Initial state comes from the preview once; this component is re-created for every new preview.
	const importable = (row: ImportPreview['rows'][number]) => !row.duplicate && row.issues.length === 0;
	let selected = $state(new Set(untrack(() => preview.rows.filter(importable).map((row) => row.key))));
	let accountIds = $state(new Map(untrack(() => preview.accounts.map((account) => [account.name, account.accountId] as const))));
	let categoryIds = $state(
		new Map(untrack(() => preview.categories.map((category) => [category.name, category.categoryId] as const)))
	);
	let pending = $state(false);
	let error = $state('');

	const payload = $derived(
		JSON.stringify(buildCommitPayload(preview, { selectedKeys: selected, accountIds, categoryIds }))
	);
	const selectableKeys = $derived(preview.rows.filter((row) => row.issues.length === 0).map((row) => row.key));
	const allSelected = $derived(selectableKeys.length > 0 && selectableKeys.every((key) => selected.has(key)));
	const duplicateCount = $derived(preview.rows.filter((row) => row.duplicate).length);
	const issueCount = $derived(preview.rows.filter((row) => row.issues.length > 0).length);

	const toggle = (key: number, checked: boolean) => {
		const next = new Set(selected);
		if (checked) next.add(key);
		else next.delete(key);
		selected = next;
	};
	const toggleAll = (checked: boolean) => (selected = new Set(checked ? selectableKeys : []));
	const setChoice = (map: Map<string, string | null>, name: string, value: string) =>
		new Map(map).set(name, value === '' ? null : value);

	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">Periksa hasil baca {preview.fileName}</h2>
		<p class="text-sm text-sage-300">
			{preview.rows.length} transaksi ditemukan
			{#if duplicateCount > 0}· {duplicateCount} kemungkinan duplikat (tidak dicentang){/if}
			{#if issueCount > 0}· {issueCount} bermasalah{/if}
		</p>
	</div>

	{#each preview.warnings as warning (warning)}
		<FormMessage message={warning} />
	{/each}

	<section aria-label="Pemetaan akun dan kategori" class="grid gap-4 rounded-card border border-forest-600 bg-forest-900 p-4 md:grid-cols-2">
		<div class="flex flex-col gap-3">
			<h3 class="font-medium">Akun</h3>
			{#each preview.accounts as draft (draft.name)}
				<label class="flex flex-col gap-1.5 text-sm text-sage-300">
					{draft.name}
					<select
						class={fieldInputClass(false)}
						value={accountIds.get(draft.name) ?? ''}
						onchange={(event) => (accountIds = setChoice(accountIds, draft.name, event.currentTarget.value))}
					>
						{#if draft.accountId === null}<option value="">Buat akun baru “{draft.name}”</option>{/if}
						{#each accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</label>
			{/each}
		</div>
		<div class="flex flex-col gap-3">
			<h3 class="font-medium">Kategori</h3>
			{#each preview.categories as draft (draft.name)}
				<label class="flex flex-col gap-1.5 text-sm text-sage-300">
					{draft.name}
					<select
						class={fieldInputClass(false)}
						value={categoryIds.get(draft.name) ?? ''}
						onchange={(event) => (categoryIds = setChoice(categoryIds, draft.name, event.currentTarget.value))}
					>
						{#if draft.categoryId === null}<option value="">Buat kategori baru “{draft.name}”</option>{/if}
						{#each categories.filter((category) => category.type === draft.type) as category (category.id)}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</label>
			{:else}
				<p class="text-sm text-sage-400">Tidak ada kategori.</p>
			{/each}
		</div>
	</section>

	<div class="overflow-x-auto rounded-card border border-forest-600">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="bg-forest-900 text-sage-300">
				<tr>
					<th class="w-10 p-3">
						<input
							type="checkbox"
							aria-label="Pilih semua"
							checked={allSelected}
							onchange={(event) => toggleAll(event.currentTarget.checked)}
						/>
					</th>
					<th class="p-3 font-medium">Tanggal</th>
					<th class="p-3 font-medium">Keterangan</th>
					<th class="p-3 font-medium">Akun</th>
					<th class="p-3 font-medium">Kategori</th>
					<th class="p-3 text-right font-medium">Jumlah</th>
				</tr>
			</thead>
			<tbody>
				{#each preview.rows as row (row.key)}
					<tr class="border-t border-forest-700 {row.issues.length > 0 ? 'opacity-60' : ''}">
						<td class="p-3">
							<input
								type="checkbox"
								aria-label="Pilih baris {row.key + 1}"
								checked={selected.has(row.key)}
								disabled={row.issues.length > 0}
								onchange={(event) => toggle(row.key, event.currentTarget.checked)}
							/>
						</td>
						<td class="p-3 whitespace-nowrap">{formatDate(row.occurredAt)}</td>
						<td class="p-3">
							{row.note || '—'}
							{#if row.duplicate}<span class="ml-1 text-xs text-sage-400">(duplikat)</span>{/if}
							{#each row.issues as issue (issue)}<span class="block text-xs text-coral-400">{issue}</span>{/each}
						</td>
						<td class="p-3">{row.accountName}</td>
						<td class="p-3">{row.categoryName ?? '—'}</td>
						<td class="p-3 text-right whitespace-nowrap {row.type === 'income' ? 'text-dino-400' : 'text-coral-400'}">
							{row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount, currency)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if error}<FormMessage message={error} />{/if}

	<form
		method="POST"
		action="?/commit"
		use:enhance={enhanceWithFeedback({
			prepare: () => (error = ''),
			onPending: (value) => (pending = value),
			onFailure: (message) => (error = message)
		})}
		class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
	>
		<input type="hidden" name="payload" value={payload} />
		<a href="/transaksi/impor" class="flex h-12 items-center justify-center rounded-control border border-forest-600 px-5 font-medium hover:bg-forest-800">
			Batal
		</a>
		<SubmitButton {pending}>Impor {selected.size} transaksi</SubmitButton>
	</form>
</div>

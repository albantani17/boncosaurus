<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Scale from '@lucide/svelte/icons/scale';
	import Upload from '@lucide/svelte/icons/upload';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import SelectField from '#lib/components/ui/SelectField.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import TransactionForm from '#lib/components/transaction/TransactionForm.svelte';
	import TransactionRow from '#lib/components/transaction/TransactionRow.svelte';
	import { CATEGORY_TYPE_LABELS } from '#lib/data/category-type-labels.ts';
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import type { TransactionRowData } from '#lib/types/transaction-row.types.ts';
	import { describeTransactionMeta } from '#lib/domain/transaction/describe-transaction-meta.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { groupTransactionsByDate } from '#lib/domain/transaction/group-transactions-by-date.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type LoadedPage = { rows: TransactionRowData[]; hasMore: boolean };

	// Extra pages belong to the first page they were loaded after; a new load (filter change,
	// saved form) replaces data.rows and thereby drops them in the same render.
	let loaded = $state.raw<{ firstPage: TransactionRowData[]; pages: LoadedPage[] }>({ firstPage: [], pages: [] });
	let loadingMore = $state(false);
	let loadError = $state('');

	const extraPages = $derived(loaded.firstPage === data.rows ? loaded.pages : []);
	const rows = $derived([...data.rows, ...extraPages.flatMap((loaded) => loaded.rows)]);
	const hasMore = $derived(extraPages.at(-1)?.hasMore ?? data.hasMore);
	const groups = $derived(groupTransactionsByDate(rows, new Date()));
	const currency = $derived(data.workspace.baseCurrency);
	const net = $derived(data.monthTotals.net);

	const typeOptions = Object.entries(TRANSACTION_TYPE_DISPLAY).map(([value, display]) => ({
		value,
		label: display.label
	}));
	const accountOptions = $derived(
		data.accounts.map((account) => ({
			value: account.id,
			label: account.isArchived ? `${account.name} (diarsipkan)` : account.name
		}))
	);
	const categoryOptions = $derived(
		data.categories.map((category) => ({
			value: category.id,
			label: `${CATEGORY_TYPE_LABELS[category.type]}: ${category.name}`
		}))
	);
	const hasActiveFilter = $derived(Boolean(data.filters.type || data.filters.accountId || data.filters.categoryId));

	let formOpen = $state(false);
	let deleteOpen = $state(false);
	let editing = $state<TransactionRowData | undefined>();
	let notice = $state('');

	const openCreate = () => {
		editing = undefined;
		formOpen = true;
	};
	const openEdit = (row: TransactionRowData) => {
		editing = row;
		formOpen = true;
	};
	const finish = (message: string) => {
		formOpen = false;
		notice = message;
	};

	$effect(() => {
		if (!page.url.searchParams.has('baru')) return;
		untrack(() => {
			const query = new URLSearchParams(page.url.search);
			query.delete('baru');
			const search = query.size > 0 ? `?${query}` : '';
			goto(`${page.url.pathname}${search}`, { replace: true, reset: false }).then(openCreate);
		});
	});

	async function loadMore() {
		loadingMore = true;
		loadError = '';
		const query = new URLSearchParams(page.url.search);
		query.set('offset', String(rows.length));
		try {
			const response = await fetch(`/transaksi/data?${query}`);
			if (!response.ok) throw new Error(String(response.status));
			const nextPage = (await response.json()) as LoadedPage;
			loaded = { firstPage: data.rows, pages: [...extraPages, nextPage] };
		} catch {
			loadError = 'Gagal memuat transaksi berikutnya. Coba lagi.';
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>Transaksi · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Transaksi</h1>
		<p class="text-sm text-sage-300">{data.monthLabel}</p>
	</div>
	<div class="flex shrink-0 gap-2">
		<a
			href="/transaksi/impor"
			class="inline-flex h-11 items-center gap-2 rounded-control border border-forest-600 px-4 text-sm font-medium hover:bg-forest-800"
		>
			<Upload class="size-4" aria-hidden="true" />
			Impor
		</a>
		<button
			type="button"
			onclick={openCreate}
			class="hidden h-11 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110 md:inline-flex"
		>
			<Plus class="size-4" aria-hidden="true" />
			Tambah transaksi
		</button>
	</div>
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}

<section aria-label="Ringkasan {data.monthLabel}" class="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
	<StatCard
		label="Pemasukan"
		value={formatCurrency(data.monthTotals.income, currency)}
		hint="Semua akun"
		icon={TrendingUp}
		tone="income"
	/>
	<StatCard
		label="Pengeluaran"
		value={formatCurrency(data.monthTotals.expense, currency)}
		hint="Semua akun"
		icon={TrendingDown}
		tone="expense"
	/>
	<div class="col-span-2 lg:col-span-1">
		<StatCard
			label="Selisih"
			value={formatCurrency(net, currency)}
			hint={net > 0 ? 'Surplus' : net < 0 ? 'Defisit' : 'Seimbang'}
			icon={Scale}
			tone={net < 0 ? 'expense' : net > 0 ? 'income' : 'neutral'}
		/>
	</div>
</section>

<form
	method="GET"
	aria-label="Filter transaksi"
	data-sveltekit-reset="false"
	onchange={(event) => event.currentTarget.requestSubmit()}
	class="grid grid-cols-2 gap-3 rounded-card border border-forest-600 bg-forest-900 p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end"
>
	<div class="flex flex-col gap-1.5">
		<label for="month" class="text-sm font-medium text-sage-300">Bulan</label>
		<input
			id="month"
			name="month"
			type="month"
			value={data.filters.month}
			class="h-12 rounded-control border border-forest-600 bg-forest-950 px-3 text-beige-100"
		/>
	</div>
	<SelectField label="Jenis" name="type" value={data.filters.type} options={typeOptions} emptyLabel="Semua" required={false} markOptional={false} />
	<SelectField
		label="Akun"
		name="accountId"
		value={data.filters.accountId}
		options={accountOptions}
		emptyLabel="Semua"
		required={false}
		markOptional={false}
	/>
	<SelectField
		label="Kategori"
		name="categoryId"
		value={data.filters.categoryId}
		options={categoryOptions}
		emptyLabel="Semua"
		required={false}
		markOptional={false}
	/>
	<div class="col-span-2 flex gap-2 lg:col-span-1">
		<button type="submit" class="h-12 flex-1 rounded-control border border-forest-600 px-4 text-sm font-medium hover:bg-forest-800">
			Terapkan
		</button>
		{#if hasActiveFilter}
			<a
				href="/transaksi?month={data.filters.month}"
				class="flex h-12 flex-1 items-center justify-center rounded-control px-4 text-sm font-medium text-sage-300 hover:bg-forest-800"
			>
				Reset
			</a>
		{/if}
	</div>
</form>

<section aria-label="Daftar transaksi" class="rounded-card border border-forest-600 bg-forest-900 px-5 py-3">
	{#if groups.length === 0}
		<EmptyState
			title={hasActiveFilter ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi bulan ini'}
			description={hasActiveFilter ? 'Coba ubah atau reset filternya.' : 'Catat pemasukan atau pengeluaran pertamamu.'}
		/>
	{:else}
		{#each groups as group (group.key)}
			<h2 class="sticky top-0 z-[1] -mx-5 bg-forest-900 px-5 pt-3 pb-1 text-xs font-semibold tracking-wide text-sage-400 uppercase">
				{group.label}
			</h2>
			<ul class="divide-y divide-forest-600">
				{#each group.rows as row (row.id)}
					<li>
						<TransactionRow {row} meta={describeTransactionMeta(row)} onselect={() => openEdit(row)} />
					</li>
				{/each}
			</ul>
		{/each}

		{#if loadError}<div class="mt-3"><FormMessage message={loadError} /></div>{/if}
		{#if hasMore}
			<button
				type="button"
				onclick={loadMore}
				disabled={loadingMore}
				class="my-3 h-11 w-full rounded-control border border-forest-600 text-sm font-medium hover:bg-forest-800 disabled:cursor-wait disabled:opacity-70"
			>
				{loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
			</button>
		{/if}
	{/if}
</section>

<Dialog bind:open={formOpen} title={editing ? 'Ubah transaksi' : 'Tambah transaksi'}>
	{#if data.accounts.every((account) => account.isArchived)}
		<FormMessage message="Buat akun dulu di halaman Akun sebelum mencatat transaksi." />
	{:else}
		<TransactionForm
			row={editing}
			accounts={data.accounts}
			categories={data.categories}
			onDone={() => finish(editing ? 'Transaksi disimpan.' : 'Transaksi dicatat.')}
		/>
	{/if}
	{#if editing}
		<div class="border-t border-forest-600 pt-4">
			<button
				type="button"
				onclick={() => {
					formOpen = false;
					deleteOpen = true;
				}}
				class="flex h-11 w-full items-center justify-center gap-2 rounded-control border border-coral-400 text-sm font-medium text-coral-400 hover:bg-forest-800"
			>
				<Trash2 class="size-4" aria-hidden="true" /> Hapus transaksi
			</button>
		</div>
	{/if}
</Dialog>

{#if editing}
	<ConfirmDialog
		bind:open={deleteOpen}
		title="Hapus transaksi ini?"
		description="{editing.note || editing.categoryName || TRANSACTION_TYPE_DISPLAY[editing.type].label} · {formatCurrency(
			editing.amount,
			editing.currency
		)}. Saldo akun akan dihitung ulang."
		action="?/delete"
		fields={{ id: editing.id }}
		onConfirmed={() => (notice = 'Transaksi dihapus.')}
	/>
{/if}

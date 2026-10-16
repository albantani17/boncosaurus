<script lang="ts">
	import ArrowDownLeft from '@lucide/svelte/icons/arrow-down-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ClockAlert from '@lucide/svelte/icons/clock-alert';
	import Plus from '@lucide/svelte/icons/plus';
	import DebtCard from '#lib/components/debt/DebtCard.svelte';
	import DebtForm from '#lib/components/debt/DebtForm.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import { DEBT_DIRECTION_LABELS } from '#lib/data/debt-labels.ts';
	import type { DebtDirection } from '#lib/types/api.types.ts';
	import { groupDebtsByCounterparty } from '#lib/domain/debt/group-debts-by-counterparty.ts';
	import { type DebtView, toDebtFilterHref } from '#lib/domain/debt/read-debt-filters.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const currency = $derived(data.workspace.baseCurrency);
	const baseTotals = $derived(
		data.summary.totals.find((totals) => totals.currency === currency) ?? { currency, payable: 0, receivable: 0 }
	);
	const otherTotals = $derived(data.summary.totals.filter((totals) => totals.currency !== currency));
	const groups = $derived(groupDebtsByCounterparty(data.debts));
	const directionLabel = $derived(DEBT_DIRECTION_LABELS[data.filters.direction].toLowerCase());

	const DIRECTIONS: DebtDirection[] = ['payable', 'receivable'];
	const VIEWS: { value: DebtView; label: string }[] = [
		{ value: 'active', label: 'Berjalan' },
		{ value: 'closed', label: 'Selesai' }
	];

	let formOpen = $state(false);
	let notice = $state('');

	const tabClass = (active: boolean) =>
		`flex h-10 flex-1 items-center justify-center rounded-[8px] text-sm font-medium ${
			active ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'
		}`;
</script>

<svelte:head>
	<title>Hutang & Piutang · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Hutang & Piutang</h1>
		<p class="text-sm text-sage-300">Pinjaman, paylater, cicilan, dan patungan yang belum kembali.</p>
	</div>
	<button
		type="button"
		onclick={() => (formOpen = true)}
		class="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
	>
		<Plus class="size-4" aria-hidden="true" />
		Catat<span class="max-sm:sr-only"> baru</span>
	</button>
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}

<section aria-label="Ringkasan" class="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
	<StatCard
		label="Hutangku"
		value={formatCurrency(baseTotals.payable, currency)}
		hint="Yang masih harus kubayar"
		icon={ArrowUpRight}
		tone="expense"
	/>
	<StatCard
		label="Piutangku"
		value={formatCurrency(baseTotals.receivable, currency)}
		hint="Yang masih harus dibayar ke aku"
		icon={ArrowDownLeft}
		tone="income"
	/>
	<div class="col-span-2 lg:col-span-1">
		<StatCard
			label="Lewat jatuh tempo"
			value={String(data.summary.overdueCount)}
			hint="Dari {data.summary.activeCount} yang berjalan"
			icon={ClockAlert}
			tone={data.summary.overdueCount > 0 ? 'expense' : 'neutral'}
		/>
	</div>
</section>

{#if otherTotals.length > 0}
	<p class="text-xs text-sage-400">
		Mata uang lain (tidak dikonversi):
		{#each otherTotals as totals, index (totals.currency)}
			{index > 0 ? ' · ' : ' '}{totals.currency}: hutang {formatCurrency(totals.payable, totals.currency)}, piutang
			{formatCurrency(totals.receivable, totals.currency)}
		{/each}
	</p>
{/if}

<nav aria-label="Pilih daftar" class="flex flex-col gap-2 sm:flex-row">
	<div class="flex flex-1 gap-1 rounded-control border border-forest-600 bg-forest-950 p-1">
		{#each DIRECTIONS as direction (direction)}
			<a
				href={toDebtFilterHref({ ...data.filters, direction })}
				aria-current={data.filters.direction === direction ? 'page' : undefined}
				class={tabClass(data.filters.direction === direction)}
			>
				{DEBT_DIRECTION_LABELS[direction]}
			</a>
		{/each}
	</div>
	<div class="flex flex-1 gap-1 rounded-control border border-forest-600 bg-forest-950 p-1">
		{#each VIEWS as view (view.value)}
			<a
				href={toDebtFilterHref({ ...data.filters, view: view.value })}
				aria-current={data.filters.view === view.value ? 'page' : undefined}
				class={tabClass(data.filters.view === view.value)}
			>
				{view.label}
			</a>
		{/each}
	</div>
</nav>

{#if groups.length === 0}
	<section class="rounded-card border border-forest-600 bg-forest-900">
		<EmptyState
			title={data.filters.view === 'active' ? `Tidak ada ${directionLabel} yang berjalan` : `Belum ada ${directionLabel} yang selesai`}
			description={data.filters.direction === 'payable'
				? 'Catat pinjaman, paylater, atau cicilan supaya jatuh temponya tidak terlewat.'
				: 'Catat uang yang kamu pinjamkan atau bagian teman saat patungan.'}
		/>
	</section>
{:else}
	<div class="grid gap-3 lg:grid-cols-2">
		{#each groups as group (group.counterpartyId)}
			<section class="flex flex-col gap-1 rounded-card border border-forest-600 bg-forest-900 p-4">
				<header class="flex items-baseline justify-between gap-3 px-2">
					<h2 class="truncate font-semibold">
						{group.name}
						{#if group.hasOverdue}<span class="ml-1 text-xs font-medium text-amber-400">· telat</span>{/if}
					</h2>
					{#if data.filters.view === 'active'}
						<p class="shrink-0 text-sm tabular-nums text-sage-300">
							{group.remaining.map((total) => formatCurrency(total.remaining, total.currency)).join(' · ')}
						</p>
					{/if}
				</header>
				<ul class="divide-y divide-forest-600">
					{#each group.debts as debt (debt.id)}
						<li><DebtCard {debt} today={data.today} /></li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<Dialog bind:open={formOpen} title="Catat hutang / piutang">
	{#if data.accounts.every((account) => account.isArchived)}
		<FormMessage message="Buat akun dulu di halaman Akun." />
	{:else}
		<DebtForm
			direction={data.filters.direction}
			accounts={data.accounts}
			categories={data.categories}
			counterparties={data.counterparties}
			baseCurrency={currency}
			onDone={() => {
				formOpen = false;
				notice = 'Hutang/piutang dicatat.';
			}}
		/>
	{/if}
</Dialog>

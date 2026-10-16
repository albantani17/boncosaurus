<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Scale from '@lucide/svelte/icons/scale';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Wallet from '@lucide/svelte/icons/wallet';
	import AccountList from '#lib/components/account/AccountList.svelte';
	import CategoryBreakdown from '#lib/components/dashboard/CategoryBreakdown.svelte';
	import DebtSummaryCard from '#lib/components/dashboard/DebtSummaryCard.svelte';
	import DebtReminderList from '#lib/components/debt/DebtReminderList.svelte';
	import DinoSprite from '#lib/components/mascot/DinoSprite.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import ForestBanner from '#lib/components/mascot/ForestBanner.svelte';
	import RecentTransactions from '#lib/components/dashboard/RecentTransactions.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import { MASCOT_MESSAGES } from '#lib/data/mascot-messages.ts';
	import { NEW_TRANSACTION_HREF } from '#lib/data/nav-items.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dashboard = $derived(data.dashboard);
	const currency = $derived(dashboard.baseCurrency);
	const baseBalance = $derived(
		dashboard.balances.find((balance) => balance.currency === currency)?.balance ?? 0
	);
	const otherBalances = $derived(dashboard.balances.filter((balance) => balance.currency !== currency));
	const net = $derived(dashboard.monthTotals.net);
</script>

<svelte:head>
	<title>Dashboard · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Halo, {data.user.name}</h1>
		<p class="text-sm text-sage-300">Ringkasan keuangan {dashboard.monthLabel}</p>
	</div>
	<a
		href={NEW_TRANSACTION_HREF}
		class="hidden h-11 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110 md:inline-flex"
	>
		<Plus class="size-4" aria-hidden="true" />
		Tambah transaksi
	</a>
</div>

<section
	aria-label="Ringkasan suasana keuangan"
	class="relative flex min-h-32 items-center justify-between gap-4 overflow-hidden rounded-card border border-forest-600 bg-forest-900 p-5"
>
	<ForestBanner />
	<p class="relative max-w-md rounded-control bg-forest-950/80 px-3 py-2 text-sm text-beige-100">
		{MASCOT_MESSAGES[dashboard.mascot]}
	</p>
	<DinoSprite state={dashboard.mascot} class="relative h-20 w-[92px] shrink-0" />
</section>

<section aria-label="Ringkasan angka" class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
	<StatCard
		label="Total saldo"
		value={formatCurrency(baseBalance, currency)}
		hint={otherBalances.map((balance) => formatCurrency(balance.balance, balance.currency)).join(' · ') ||
			undefined}
		icon={Wallet}
	/>
	<StatCard
		label="Pemasukan"
		value={formatCurrency(dashboard.monthTotals.income, currency)}
		hint="Bulan ini"
		icon={TrendingUp}
		tone="income"
	/>
	<StatCard
		label="Pengeluaran"
		value={formatCurrency(dashboard.monthTotals.expense, currency)}
		hint="Bulan ini"
		icon={TrendingDown}
		tone="expense"
	/>
	<StatCard
		label="Selisih"
		value={formatCurrency(net, currency)}
		hint={net > 0 ? 'Surplus bulan ini' : net < 0 ? 'Defisit bulan ini' : 'Seimbang bulan ini'}
		icon={Scale}
		tone={net < 0 ? 'expense' : net > 0 ? 'income' : 'neutral'}
	/>
</section>

{#if data.reminders.length > 0}
	<section aria-labelledby="reminders-heading" class="flex flex-col gap-2 rounded-card border border-amber-400/50 bg-forest-900 p-5">
		<h2 id="reminders-heading" class="text-base font-semibold">Segera jatuh tempo</h2>
		<DebtReminderList reminders={data.reminders.slice(0, 3)} />
		{#if data.reminders.length > 3}
			<a href="/hutang" class="text-sm text-sage-300 underline hover:text-beige-100">+{data.reminders.length - 3} lainnya</a>
		{/if}
	</section>
{/if}

<DebtSummaryCard debts={dashboard.debts} {currency} />

{#if dashboard.otherCurrencyTotals.length > 0}
	<p class="text-xs text-sage-400">
		Mata uang lain bulan ini (tidak dikonversi):
		{#each dashboard.otherCurrencyTotals as totals, index (totals.currency)}
			{index > 0 ? ' · ' : ' '}{totals.currency}: masuk {formatCurrency(totals.income, totals.currency)}, keluar
			{formatCurrency(totals.expense, totals.currency)}
		{/each}
	</p>
{/if}

<div class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
	<section class="flex flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5">
		<h2 class="text-base font-semibold">Pengeluaran per kategori</h2>
		<CategoryBreakdown items={dashboard.breakdown} {currency} />
	</section>

	<section class="flex flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5">
		<h2 class="text-base font-semibold">Saldo per akun</h2>
		<AccountList accounts={dashboard.accounts} />
	</section>
</div>

<section class="flex flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5">
	<h2 class="text-base font-semibold">Transaksi terbaru</h2>
	{#if dashboard.recentTransactions.length === 0}
		<EmptyState
			title="Belum ada transaksi"
			description="Transaksi yang kamu catat akan muncul di sini."
		/>
	{:else}
		<RecentTransactions transactions={dashboard.recentTransactions} />
	{/if}
</section>

<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import Handshake from '@lucide/svelte/icons/handshake';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import DebtEditForm from '#lib/components/debt/DebtEditForm.svelte';
	import DebtPaymentForm from '#lib/components/debt/DebtPaymentForm.svelte';
	import DebtProgress from '#lib/components/debt/DebtProgress.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import {
		DEBT_DIRECTION_LABELS,
		DEBT_SOURCE_LABELS,
		DEBT_STATUS_LABELS,
		INSTALLMENT_STATUS_LABELS
	} from '#lib/data/debt-labels.ts';
	import type { DebtPayment, InstallmentStatus } from '#lib/types/api.types.ts';
	import { formatDueDate } from '#lib/domain/debt/format-due-date.ts';
	import { DIRECTION_PARAM } from '#lib/domain/debt/read-debt-filters.ts';
	import { formatCalendarDate } from '#lib/utils/format-calendar-date.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { formatDayLabel } from '#lib/utils/format-day-label.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const debt = $derived(data.debt);
	const money = (amount: number) => formatCurrency(amount, debt.currency);
	const isActive = $derived(debt.status === 'active');
	const isPayable = $derived(debt.direction === 'payable');
	const accountNames = $derived(new Map(data.accounts.map((account) => [account.id, account.name])));
	const categoryName = $derived(data.categories.find((category) => category.id === debt.categoryId)?.name);
	const originText = $derived(
		debt.origin === 'cash'
			? `${isPayable ? 'Uang masuk ke' : 'Uang keluar dari'} ${accountNames.get(debt.accountId ?? '') ?? 'akun'}`
			: debt.origin === 'split'
				? 'Bagian dari transaksi patungan'
				: `Dibeli tanpa uang keluar saat itu${categoryName ? ` · kategori ${categoryName}` : ''}`
	);

	const STATUS_CLASS: Record<InstallmentStatus, string> = {
		paid: 'text-dino-400',
		partial: 'text-sage-300',
		due: 'text-sage-400',
		overdue: 'text-amber-400'
	};

	let payOpen = $state(false);
	let editOpen = $state(false);
	let writeOffOpen = $state(false);
	let deleteOpen = $state(false);
	let deletingPayment = $state<DebtPayment | undefined>();
	let deletePaymentOpen = $state(false);
	let notice = $state('');

	const done = (message: string) => () => {
		payOpen = false;
		editOpen = false;
		notice = message;
	};
</script>

<svelte:head>
	<title>{debt.title} · Boncosaurus</title>
</svelte:head>

<a
	href="/hutang?arah={DIRECTION_PARAM[debt.direction]}"
	class="-ml-2 inline-flex h-11 w-fit items-center gap-2 rounded-control px-2 text-sm text-sage-300 hover:bg-forest-800"
>
	<ArrowLeft class="size-4" aria-hidden="true" />
	{DEBT_DIRECTION_LABELS[debt.direction]}
</a>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div class="flex min-w-0 flex-col gap-1">
		<p class="text-sm text-sage-300">
			{isPayable ? 'Hutang ke' : 'Piutang dari'} <span class="font-medium text-beige-100">{debt.counterpartyName}</span>
			· {DEBT_SOURCE_LABELS[debt.sourceType]}
		</p>
		<h1 class="truncate text-2xl font-semibold tracking-tight lg:text-3xl">{debt.title}</h1>
	</div>
	<div class="flex shrink-0 gap-2">
		<button
			type="button"
			onclick={() => (editOpen = true)}
			aria-label="Ubah"
			class="flex size-11 items-center justify-center rounded-control border border-forest-600 text-sage-300 hover:bg-forest-800"
		>
			<Pencil class="size-4" aria-hidden="true" />
		</button>
		{#if isActive}
			<button
				type="button"
				onclick={() => (payOpen = true)}
				class="inline-flex h-11 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
			>
				<HandCoins class="size-4" aria-hidden="true" />
				{isPayable ? 'Bayar' : 'Terima bayaran'}
			</button>
		{/if}
	</div>
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}

<section aria-label="Posisi" class="flex flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-sm text-sage-300">{isActive ? 'Sisa' : DEBT_STATUS_LABELS[debt.status]}</p>
			<p class="text-3xl font-semibold tabular-nums">{money(isActive ? debt.position.remaining : debt.position.paid)}</p>
			{#if !isActive && debt.writtenOffAmount}
				<p class="text-xs text-sage-400">{money(debt.writtenOffAmount)} diikhlaskan</p>
			{/if}
		</div>
		{#if isActive && debt.position.nextDueDate}
			<p class="text-sm {debt.position.isOverdue ? 'text-amber-400' : 'text-sage-300'}">
				{formatDueDate(debt.position.nextDueDate, data.today)}
			</p>
		{/if}
	</div>
	<DebtProgress paid={debt.position.paid} totalDue={debt.position.totalDue} direction={debt.direction} />
	<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
		<div>
			<dt class="text-sage-400">Pokok</dt>
			<dd class="tabular-nums">{money(debt.principal)}</dd>
		</div>
		<div>
			<dt class="text-sage-400">Total tagihan</dt>
			<dd class="tabular-nums">{money(debt.position.totalDue)}</dd>
		</div>
		<div>
			<dt class="text-sage-400">Sudah dibayar</dt>
			<dd class="tabular-nums">{money(debt.position.paid)}</dd>
		</div>
		<div>
			<dt class="text-sage-400">Tanggal</dt>
			<dd>{formatDayLabel(new Date(debt.originatedAt), new Date())}</dd>
		</div>
	</dl>
	<p class="text-xs text-sage-400">{originText}{debt.note ? ` · ${debt.note}` : ''}</p>
</section>

{#if debt.installments.length > 0}
	<section class="flex flex-col gap-3 rounded-card border border-forest-600 bg-forest-900 p-5">
		<h2 class="text-base font-semibold">Jadwal cicilan</h2>
		<ol class="divide-y divide-forest-600">
			{#each debt.installments as installment (installment.id)}
				<li class="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
					<span class="min-w-0">
						<span class="block">Cicilan {installment.sequence}</span>
						<span class="block text-xs text-sage-400">{formatCalendarDate(installment.dueDate)}</span>
					</span>
					<span class="shrink-0 text-right">
						<span class="block tabular-nums">{money(installment.amount)}</span>
						<span class="block text-xs {STATUS_CLASS[installment.status]}">
							{INSTALLMENT_STATUS_LABELS[installment.status]}{installment.status === 'partial'
								? ` · ${money(installment.paidAmount)}`
								: ''}
						</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>
{/if}

<section class="flex flex-col gap-3 rounded-card border border-forest-600 bg-forest-900 p-5">
	<h2 class="text-base font-semibold">Riwayat pembayaran</h2>
	{#if debt.payments.length === 0}
		<p class="text-sm text-sage-400">Belum ada pembayaran.</p>
	{:else}
		<ul class="divide-y divide-forest-600">
			{#each [...debt.payments].reverse() as payment (payment.id)}
				<li class="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0">
					<span class="min-w-0 flex-1">
						<span class="block">{formatDayLabel(new Date(payment.paidAt), new Date())}</span>
						<span class="block truncate text-xs text-sage-400">
							{accountNames.get(payment.accountId) ?? '-'}
							{#if payment.extraAmount > 0}· termasuk {money(payment.extraAmount)} {isPayable ? 'bunga/biaya' : 'lebih bayar'}{/if}
							{#if payment.note}· {payment.note}{/if}
						</span>
					</span>
					<span class="shrink-0 font-medium tabular-nums">{money(payment.amount)}</span>
					{#if debt.status !== 'written_off'}
						<button
							type="button"
							aria-label="Hapus pembayaran {money(payment.amount)}"
							onclick={() => {
								deletingPayment = payment;
								deletePaymentOpen = true;
							}}
							class="flex size-11 shrink-0 items-center justify-center rounded-control text-sage-400 hover:bg-forest-800"
						>
							<Trash2 class="size-4" aria-hidden="true" />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="flex flex-col gap-3 sm:flex-row">
	{#if isActive}
		<button
			type="button"
			onclick={() => (writeOffOpen = true)}
			class="flex h-11 flex-1 items-center justify-center gap-2 rounded-control border border-forest-600 text-sm font-medium hover:bg-forest-800"
		>
			<Handshake class="size-4" aria-hidden="true" /> Ikhlaskan sisanya
		</button>
	{/if}
	<button
		type="button"
		onclick={() => (deleteOpen = true)}
		class="flex h-11 flex-1 items-center justify-center gap-2 rounded-control border border-coral-400 text-sm font-medium text-coral-400 hover:bg-forest-800"
	>
		<Trash2 class="size-4" aria-hidden="true" /> Hapus catatan
	</button>
</div>

<Dialog bind:open={payOpen} title={isPayable ? 'Bayar hutang' : 'Terima pembayaran'}>
	<DebtPaymentForm {debt} accounts={data.accounts} categories={data.categories} onDone={done('Pembayaran dicatat.')} />
</Dialog>

<Dialog bind:open={editOpen} title="Ubah catatan">
	<DebtEditForm {debt} onDone={done('Perubahan disimpan.')} />
</Dialog>

<ConfirmDialog
	bind:open={writeOffOpen}
	title="Ikhlaskan sisa {money(debt.position.principalRemaining)}?"
	description={isPayable
		? 'Sisa pokok dianggap tidak perlu dibayar dan dicatat sebagai pemasukan hari ini.'
		: 'Sisa pokok dianggap tidak kembali dan dicatat sebagai pengeluaran hari ini.'}
	action="?/writeOff"
	fields={{}}
	confirmLabel="Ikhlaskan"
	onConfirmed={() => (notice = 'Sisanya sudah diikhlaskan.')}
/>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Hapus catatan {debt.title}?"
	description="Semua pembayarannya ikut terhapus dan saldo akun dihitung ulang."
	action="?/delete"
	fields={{ direction: debt.direction }}
/>

{#if deletingPayment}
	<ConfirmDialog
		bind:open={deletePaymentOpen}
		title="Hapus pembayaran {money(deletingPayment.amount)}?"
		description="Transaksinya ikut dihapus dan sisa {DEBT_DIRECTION_LABELS[debt.direction].toLowerCase()} bertambah lagi."
		action="?/deletePayment"
		fields={{ paymentId: deletingPayment.id }}
		onConfirmed={() => (notice = 'Pembayaran dihapus.')}
	/>
{/if}

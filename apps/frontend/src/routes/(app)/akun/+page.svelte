<script lang="ts">
	import { enhance } from '$app/forms';
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Wallet from '@lucide/svelte/icons/wallet';
	import AccountForm from '#lib/components/account/AccountForm.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import { ACCOUNT_TYPE_LABELS } from '#lib/data/account-type-labels.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Account } from '#lib/types/api.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import { sumBalancesByCurrency } from '#lib/domain/account/sum-balances-by-currency.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const activeAccounts = $derived(data.accounts.filter((account) => !account.isArchived));
	const archivedAccounts = $derived(data.accounts.filter((account) => account.isArchived));
	const totals = $derived(sumBalancesByCurrency(data.accounts));

	let formOpen = $state(false);
	let deleteOpen = $state(false);
	let editing = $state<Account | undefined>();
	let notice = $state('');
	let actionError = $state('');

	const openCreate = () => {
		editing = undefined;
		formOpen = true;
	};
	const openEdit = (account: Account) => {
		editing = account;
		actionError = '';
		formOpen = true;
	};
	const finish = (message: string) => {
		formOpen = false;
		notice = message;
	};
</script>

<svelte:head>
	<title>Akun · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Akun</h1>
		<p class="text-sm text-sage-300">Tempat uangmu disimpan: rekening, dompet, e-wallet.</p>
	</div>
	<button
		type="button"
		onclick={openCreate}
		class="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
	>
		<Plus class="size-4" aria-hidden="true" />
		Tambah<span class="max-sm:sr-only"> akun</span>
	</button>
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}

{#if totals.length > 0}
	<section aria-label="Total saldo" class="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
		{#each totals as total (total.currency)}
			<StatCard
				label="Total saldo {total.currency}"
				value={formatCurrency(total.balance, total.currency)}
				hint="Akun aktif"
				icon={Wallet}
			/>
		{/each}
	</section>
{/if}

{#snippet accountCard(account: Account)}
	<li class="flex items-center gap-3 rounded-card border border-forest-600 bg-forest-900 p-4">
		<div class="min-w-0 flex-1">
			<p class="truncate font-medium">{account.name}</p>
			<p class="text-xs text-sage-400">{ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}</p>
		</div>
		<p class="shrink-0 font-semibold tabular-nums">{formatCurrency(account.balance, account.currency)}</p>
		<button
			type="button"
			onclick={() => openEdit(account)}
			aria-label="Ubah {account.name}"
			class="flex size-11 shrink-0 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
		>
			<Pencil class="size-4" aria-hidden="true" />
		</button>
	</li>
{/snippet}

{#if data.accounts.length === 0}
	<section class="rounded-card border border-forest-600 bg-forest-900">
		<EmptyState title="Belum ada akun" description="Tambahkan rekening atau dompet pertamamu untuk mulai mencatat." />
	</section>
{:else}
	<ul class="grid gap-3 md:grid-cols-2">
		{#each activeAccounts as account (account.id)}
			{@render accountCard(account)}
		{/each}
	</ul>
{/if}

{#if archivedAccounts.length > 0}
	<details class="group rounded-card border border-forest-600 bg-forest-900 p-4">
		<summary class="cursor-pointer text-sm font-medium text-sage-300">
			Diarsipkan ({archivedAccounts.length})
		</summary>
		<ul class="mt-3 grid gap-3 opacity-80 md:grid-cols-2">
			{#each archivedAccounts as account (account.id)}
				{@render accountCard(account)}
			{/each}
		</ul>
	</details>
{/if}

<Dialog bind:open={formOpen} title={editing ? 'Ubah akun' : 'Tambah akun'}>
	<AccountForm
		account={editing}
		baseCurrency={data.workspace.baseCurrency}
		onDone={() => finish(editing ? 'Akun disimpan.' : 'Akun ditambahkan.')}
	/>

	{#if editing}
		{@const target = editing}
		<div class="flex flex-col gap-3 border-t border-forest-600 pt-4">
			{#if actionError}<FormMessage message={actionError} />{/if}
			<div class="flex flex-col gap-3 sm:flex-row">
				<form
					method="POST"
					action="?/archive"
					class="flex-1"
					use:enhance={enhanceWithFeedback({
						onSuccess: (message) => finish(message ?? ''),
						onFailure: (message) => (actionError = message)
					})}
				>
					<input type="hidden" name="id" value={target.id} />
					<input type="hidden" name="archived" value={String(!target.isArchived)} />
					<button
						type="submit"
						class="flex h-11 w-full items-center justify-center gap-2 rounded-control border border-forest-600 text-sm font-medium hover:bg-forest-800"
					>
						{#if target.isArchived}
							<ArchiveRestore class="size-4" aria-hidden="true" /> Pulihkan
						{:else}
							<Archive class="size-4" aria-hidden="true" /> Arsipkan
						{/if}
					</button>
				</form>
				<button
					type="button"
					onclick={() => {
						formOpen = false;
						deleteOpen = true;
					}}
					class="flex h-11 flex-1 items-center justify-center gap-2 rounded-control border border-coral-400 text-sm font-medium text-coral-400 hover:bg-forest-800"
				>
					<Trash2 class="size-4" aria-hidden="true" /> Hapus
				</button>
			</div>
		</div>
	{/if}
</Dialog>

{#if editing}
	<ConfirmDialog
		bind:open={deleteOpen}
		title="Hapus akun {editing.name}?"
		description="Akun yang sudah punya transaksi tidak bisa dihapus; arsipkan saja agar riwayatnya tetap ada."
		action="?/delete"
		fields={{ id: editing.id }}
		onConfirmed={() => (notice = 'Akun dihapus.')}
	/>
{/if}

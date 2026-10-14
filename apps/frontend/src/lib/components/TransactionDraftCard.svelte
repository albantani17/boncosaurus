<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import X from '@lucide/svelte/icons/x';
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { TransactionProposal } from '#lib/types/ai.types.ts';
	import type { Account, Category } from '#lib/types/api.types.ts';
	import { describeTransactionProposal } from '#lib/utils/describe-transaction-proposal.ts';
	import FormMessage from './FormMessage.svelte';

	type Props = {
		proposal: TransactionProposal;
		messageId: string;
		toolCallId: string;
		accounts: Account[];
		categories: Category[];
		interactive: boolean;
		onResolved: (status: 'saved' | 'dismissed') => void;
	};

	let { proposal, messageId, toolCallId, accounts, categories, interactive, onResolved }: Props = $props();

	let pending = $state<'confirm' | 'dismiss' | null>(null);
	let error = $state('');

	const draft = $derived(proposal.status === 'invalid' ? null : proposal.draft);
	const summary = $derived(draft ? describeTransactionProposal(draft, accounts, categories) : null);
	const display = $derived(draft ? TRANSACTION_TYPE_DISPLAY[draft.type] : null);

	const feedback = (action: 'confirm' | 'dismiss', status: 'saved' | 'dismissed') =>
		enhanceWithFeedback({
			onPending: (value) => (pending = value ? action : null),
			onSuccess: () => onResolved(status),
			onFailure: (message) => (error = message)
		});
</script>

{#if proposal.status === 'invalid'}
	<p class="flex items-start gap-2 rounded-control border border-forest-600 px-3 py-2 text-xs text-sage-400">
		<CircleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
		Draf ditolak: {proposal.message}
	</p>
{:else if draft && summary && display}
	<div class="flex flex-col gap-3 rounded-card border border-forest-600 bg-forest-950 p-4">
		<div class="flex items-start justify-between gap-3">
			<div class="flex flex-col gap-0.5">
				<span class="text-xs font-medium tracking-wide text-sage-400 uppercase">Draf {display.label.toLowerCase()}</span>
				<span class="text-xl font-semibold {display.textClass}">{display.sign}{summary.amount}</span>
			</div>
			<display.icon class="size-5 {display.textClass}" aria-hidden="true" />
		</div>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
			<dt class="text-sage-400">{draft.type === 'transfer' ? 'Dari' : 'Akun'}</dt>
			<dd class="text-beige-100">{summary.account}</dd>
			{#if summary.toAccount}
				<dt class="text-sage-400">Ke</dt>
				<dd class="text-beige-100">
					{summary.toAccount}{#if summary.toAmount}<span class="text-sage-300"> · diterima {summary.toAmount}</span>{/if}
				</dd>
			{/if}
			{#if summary.category}
				<dt class="text-sage-400">Kategori</dt>
				<dd class="text-beige-100">{summary.category}</dd>
			{/if}
			<dt class="text-sage-400">Waktu</dt>
			<dd class="text-beige-100">{summary.date}</dd>
			{#if draft.note}
				<dt class="text-sage-400">Catatan</dt>
				<dd class="break-words text-beige-100">{draft.note}</dd>
			{/if}
		</dl>

		{#if error}<FormMessage message={error} />{/if}

		{#if proposal.status === 'saved'}
			<p class="flex items-center gap-2 text-sm font-medium text-dino-400">
				<Check class="size-4" aria-hidden="true" /> Tersimpan.
				<a href="/transaksi" class="font-normal text-sage-300 underline hover:text-beige-100">Lihat transaksi</a>
			</p>
		{:else if proposal.status === 'dismissed'}
			<p class="flex items-center gap-2 text-sm text-sage-400"><X class="size-4" aria-hidden="true" /> Diabaikan.</p>
		{:else if interactive}
			<div class="flex gap-2">
				<form method="POST" action="?/confirmDraft" class="flex-1" use:enhance={feedback('confirm', 'saved')}>
					<input type="hidden" name="messageId" value={messageId} />
					<input type="hidden" name="toolCallId" value={toolCallId} />
					<button
						type="submit"
						disabled={pending !== null}
						class="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-dino-400 text-sm font-semibold text-forest-950 hover:brightness-110 disabled:opacity-60"
					>
						<Check class="size-4" aria-hidden="true" />
						{pending === 'confirm' ? 'Menyimpan…' : 'Simpan'}
					</button>
				</form>
				<form method="POST" action="?/dismissDraft" use:enhance={feedback('dismiss', 'dismissed')}>
					<input type="hidden" name="messageId" value={messageId} />
					<input type="hidden" name="toolCallId" value={toolCallId} />
					<button
						type="submit"
						disabled={pending !== null}
						class="flex h-11 items-center justify-center gap-2 rounded-control border border-forest-600 px-4 text-sm font-medium hover:bg-forest-800 disabled:opacity-60"
					>
						Abaikan
					</button>
				</form>
			</div>
		{:else}
			<p class="text-xs text-sage-400">Menunggu jawaban selesai…</p>
		{/if}
	</div>
{/if}

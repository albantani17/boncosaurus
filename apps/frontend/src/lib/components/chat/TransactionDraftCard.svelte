<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { TRANSACTION_TYPE_DISPLAY } from '#lib/data/transaction-type-display.ts';
	import type { TransactionProposal } from '#lib/types/ai.types.ts';
	import type { Account, Category } from '#lib/types/api.types.ts';
	import { describeTransactionProposal } from '#lib/domain/chat/describe-transaction-proposal.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';
	import DraftActions from './DraftActions.svelte';

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

	const draft = $derived(proposal.status === 'invalid' ? null : proposal.draft);
	const summary = $derived(draft ? describeTransactionProposal(draft, accounts, categories) : null);
	const display = $derived(draft ? TRANSACTION_TYPE_DISPLAY[draft.type] : null);
	const currency = $derived(accounts.find((account) => account.id === draft?.accountId)?.currency);
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
			{#if summary.fee}
				<dt class="text-sage-400">Biaya admin</dt>
				<dd class="text-beige-100">{summary.fee}</dd>
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
			{#each draft.splits ?? [] as split (split.counterpartyName)}
				<dt class="text-sage-400">Bagian</dt>
				<dd class="text-beige-100">{split.counterpartyName} · {formatCurrency(split.amount, currency)} (piutang)</dd>
			{/each}
		</dl>

		<DraftActions
			status={proposal.status}
			{messageId}
			{toolCallId}
			{interactive}
			savedHref={draft.splits?.length ? '/hutang?arah=piutang' : '/transaksi'}
			savedLabel={draft.splits?.length ? 'Lihat piutang' : 'Lihat transaksi'}
			{onResolved}
		/>
	</div>
{/if}

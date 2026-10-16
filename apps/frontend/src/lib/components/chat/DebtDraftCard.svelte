<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import type {
		DebtPaymentProposal,
		DebtPaymentProposalDraft,
		DebtProposal,
		DebtProposalDraft,
		DebtWriteOffProposal,
		DebtWriteOffProposalDraft
	} from '#lib/types/ai.types.ts';
	import type { Account, Category } from '#lib/types/api.types.ts';
	import {
		type DebtDraftSummary,
		describeDebtPaymentProposal,
		describeDebtProposal,
		describeDebtWriteOffProposal
	} from '#lib/domain/chat/describe-debt-proposals.ts';
	import DraftActions from './DraftActions.svelte';

	type DebtToolName = 'proposeDebt' | 'proposeDebtPayment' | 'proposeDebtWriteOff';

	type Props = {
		toolName: DebtToolName;
		proposal: DebtProposal | DebtPaymentProposal | DebtWriteOffProposal;
		messageId: string;
		toolCallId: string;
		accounts: Account[];
		categories: Category[];
		interactive: boolean;
		onResolved: (status: 'saved' | 'dismissed') => void;
	};

	let { toolName, proposal, messageId, toolCallId, accounts, categories, interactive, onResolved }: Props = $props();

	const CONFIRM_LABELS: Record<DebtToolName, string> = {
		proposeDebt: 'Simpan',
		proposeDebtPayment: 'Catat pembayaran',
		proposeDebtWriteOff: 'Ikhlaskan'
	};

	const summary = $derived.by((): DebtDraftSummary | null => {
		if (proposal.status === 'invalid') return null;
		if (toolName === 'proposeDebt') return describeDebtProposal(proposal.draft as DebtProposalDraft, accounts, categories);
		if (toolName === 'proposeDebtPayment') {
			return describeDebtPaymentProposal(proposal.draft as DebtPaymentProposalDraft, accounts, categories);
		}
		return describeDebtWriteOffProposal(proposal.draft as DebtWriteOffProposalDraft);
	});
	// A debt saved from this card has no id in the local copy, so it links to the list instead.
	const savedHref = $derived(
		proposal.status === 'saved' && 'debtId' in proposal ? `/hutang/${proposal.debtId}` : (summary?.savedHref ?? '/hutang')
	);
</script>

{#if proposal.status === 'invalid'}
	<p class="flex items-start gap-2 rounded-control border border-forest-600 px-3 py-2 text-xs text-sage-400">
		<CircleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
		Draf ditolak: {proposal.message}
	</p>
{:else if summary}
	{@const toneClass = summary.tone === 'income' ? 'text-dino-400' : 'text-coral-400'}
	<div class="flex flex-col gap-3 rounded-card border border-forest-600 bg-forest-950 p-4">
		<div class="flex items-start justify-between gap-3">
			<div class="flex flex-col gap-0.5">
				<span class="text-xs font-medium tracking-wide text-sage-400 uppercase">{summary.kicker}</span>
				<span class="text-xl font-semibold {toneClass}">{summary.amount}</span>
			</div>
			<HandCoins class="size-5 {toneClass}" aria-hidden="true" />
		</div>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
			{#each summary.rows as row (row.label)}
				<dt class="text-sage-400">{row.label}</dt>
				<dd class="break-words text-beige-100">{row.value}</dd>
			{/each}
		</dl>

		<DraftActions
			status={proposal.status}
			{messageId}
			{toolCallId}
			{interactive}
			{savedHref}
			savedLabel="Lihat hutang/piutang"
			confirmLabel={CONFIRM_LABELS[toolName]}
			{onResolved}
		/>
	</div>
{/if}

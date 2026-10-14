<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { UIMessage } from 'ai';
	import { CHAT_TOOL_LABELS } from '#lib/data/chat-tool-labels.ts';
	import type { TransactionProposal } from '#lib/types/ai.types.ts';
	import type { Account, Category } from '#lib/types/api.types.ts';
	import { getToolPartName } from '#lib/utils/get-tool-part-name.ts';
	import ChatMarkdown from './ChatMarkdown.svelte';
	import TransactionDraftCard from './TransactionDraftCard.svelte';

	type ToolPart = { type: string; toolCallId: string; state: string; output?: unknown; errorText?: string };

	type Props = {
		message: UIMessage;
		accounts: Account[];
		categories: Category[];
		interactive: boolean;
		onProposalResolved: (toolCallId: string, status: 'saved' | 'dismissed') => void;
	};

	let { message, accounts, categories, interactive, onProposalResolved }: Props = $props();

	const isUser = $derived(message.role === 'user');
</script>

{#snippet toolActivity(part: ToolPart, name: string)}
	{@const labels = CHAT_TOOL_LABELS[name] ?? { running: 'Memproses…', done: 'Selesai' }}
	{#if part.state === 'output-error'}
		<p class="flex items-center gap-1.5 text-xs text-coral-400">
			<CircleAlert class="size-3.5" aria-hidden="true" />
			{part.errorText ?? 'Alat gagal dijalankan.'}
		</p>
	{:else if part.state === 'output-available'}
		<p class="flex items-center gap-1.5 text-xs text-sage-400">
			<Check class="size-3.5" aria-hidden="true" />
			{labels.done}
		</p>
	{:else}
		<p class="flex items-center gap-1.5 text-xs text-sage-400">
			<LoaderCircle class="size-3.5 animate-spin" aria-hidden="true" />
			{labels.running}
		</p>
	{/if}
{/snippet}

<li class="flex {isUser ? 'justify-end' : 'justify-start'}">
	<div
		class="flex max-w-[min(100%,40rem)] flex-col gap-2 text-sm
			{isUser ? 'rounded-card rounded-br-md bg-forest-700 px-4 py-3 text-beige-100' : 'w-full text-beige-200'}"
	>
		{#each message.parts as part, index (index)}
			{@const toolName = getToolPartName(part)}
			{#if part.type === 'text'}
				{#if isUser}
					<p class="whitespace-pre-wrap break-words">{part.text}</p>
				{:else}
					<ChatMarkdown text={part.text} />
				{/if}
			{:else if toolName === 'proposeTransaction' && (part as ToolPart).state === 'output-available'}
				{@const toolPart = part as ToolPart}
				<TransactionDraftCard
					proposal={toolPart.output as TransactionProposal}
					messageId={message.id}
					toolCallId={toolPart.toolCallId}
					{accounts}
					{categories}
					{interactive}
					onResolved={(status) => onProposalResolved(toolPart.toolCallId, status)}
				/>
			{:else if toolName}
				{@render toolActivity(part as ToolPart, toolName)}
			{/if}
		{/each}
	</div>
</li>

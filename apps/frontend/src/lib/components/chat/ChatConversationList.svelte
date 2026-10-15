<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import type { Conversation } from '#lib/types/ai.types.ts';
	import { formatTransactionDate } from '#lib/domain/transaction/format-transaction-date.ts';

	type Props = { conversations: Conversation[]; activeId?: string };

	let { conversations, activeId }: Props = $props();

	const now = new Date();
</script>

<nav aria-label="Riwayat percakapan">
	<ul class="flex flex-col gap-1">
		{#each conversations as conversation (conversation.id)}
			{@const active = conversation.id === activeId}
			<li>
				<a
					href="/asisten/{conversation.id}"
					aria-current={active ? 'page' : undefined}
					class="flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm
						{active ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'}"
				>
					<MessageSquare class="size-4 shrink-0" aria-hidden="true" />
					<span class="min-w-0 flex-1 truncate">{conversation.title ?? 'Percakapan baru'}</span>
					<span class="shrink-0 text-xs text-sage-400">
						{formatTransactionDate(new Date(conversation.updatedAt), now)}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

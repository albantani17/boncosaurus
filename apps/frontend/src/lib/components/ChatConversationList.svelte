<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Plus from '@lucide/svelte/icons/plus';
	import type { Conversation } from '#lib/types/ai.types.ts';
	import { formatTransactionDate } from '#lib/utils/format-transaction-date.ts';

	type Props = { conversations: Conversation[]; activeId?: string; canStart: boolean };

	let { conversations, activeId, canStart }: Props = $props();

	const now = new Date();
</script>

<div class="flex flex-col gap-3">
	<form method="POST" action="/asisten?/new">
		<button
			type="submit"
			disabled={!canStart}
			class="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110 disabled:opacity-50"
		>
			<Plus class="size-4" aria-hidden="true" />
			Percakapan baru
		</button>
	</form>

	{#if conversations.length > 0}
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
	{/if}
</div>

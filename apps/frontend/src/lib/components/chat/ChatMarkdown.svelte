<script lang="ts">
	import { type ChatSpan, parseChatMarkdown } from '#lib/domain/chat/parse-chat-markdown.ts';

	let { text }: { text: string } = $props();

	const blocks = $derived(parseChatMarkdown(text));
</script>

{#snippet spans(items: ChatSpan[])}
	{#each items as span, index (index)}
		{#if span.bold}<strong class="font-semibold text-beige-100">{span.text}</strong>{:else}{span.text}{/if}
	{/each}
{/snippet}

<div class="flex flex-col gap-2 leading-relaxed">
	{#each blocks as block, index (index)}
		{#if block.type === 'paragraph'}
			<p class="whitespace-pre-wrap">{@render spans(block.spans)}</p>
		{:else if block.ordered}
			<ol class="flex list-decimal flex-col gap-1 pl-5">
				{#each block.items as item, itemIndex (itemIndex)}<li>{@render spans(item)}</li>{/each}
			</ol>
		{:else}
			<ul class="flex list-disc flex-col gap-1 pl-5">
				{#each block.items as item, itemIndex (itemIndex)}<li>{@render spans(item)}</li>{/each}
			</ul>
		{/if}
	{/each}
</div>

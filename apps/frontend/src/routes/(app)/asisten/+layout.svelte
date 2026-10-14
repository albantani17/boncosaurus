<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import ChatSidebar from '#lib/components/ChatSidebar.svelte';
	import { createChatPanel, setChatPanel } from '#lib/state/chat-panel.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const panel = setChatPanel(createChatPanel());

	onMount(panel.restore);
	afterNavigate(() => (panel.mobileOpen = false));
</script>

<div class="flex">
	<ChatSidebar conversations={data.conversations} />
	<div class="relative min-w-0 flex-1">
		{@render children()}
	</div>
</div>

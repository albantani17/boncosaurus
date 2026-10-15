<script lang="ts">
	import { page } from '$app/state';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import Settings from '@lucide/svelte/icons/settings';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import X from '@lucide/svelte/icons/x';
	import { getChatPanel } from '#lib/state/chat-panel.svelte.ts';
	import type { Conversation } from '#lib/types/ai.types.ts';
	import ChatConversationList from './ChatConversationList.svelte';

	type Props = { conversations: Conversation[] };

	let { conversations }: Props = $props();

	const panel = getChatPanel();
	const settingsActive = $derived(page.url.pathname.startsWith('/asisten/pengaturan'));
	const newChatActive = $derived(page.url.pathname === '/asisten');
</script>

{#snippet content(onClose: () => void, closeLabel: string, CloseIcon: typeof X)}
	<div class="flex h-14 shrink-0 items-center gap-2 px-3">
		<Sparkles class="size-5 shrink-0 text-dino-400" aria-hidden="true" />
		<p class="flex-1 font-semibold tracking-tight text-beige-100">Asisten</p>
		<button
			type="button"
			onclick={onClose}
			aria-label={closeLabel}
			class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
		>
			<CloseIcon class="size-5" aria-hidden="true" />
		</button>
	</div>

	<div class="px-3">
		<a
			href="/asisten"
			aria-current={newChatActive ? 'page' : undefined}
			class="flex h-11 items-center justify-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
		>
			<SquarePen class="size-4" aria-hidden="true" />
			Pesan baru
		</a>
	</div>

	<div class="mt-4 flex min-h-0 flex-1 flex-col gap-2">
		<p class="px-6 text-xs font-medium tracking-wide text-sage-400 uppercase">Riwayat</p>
		<div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
			{#if conversations.length > 0}
				<ChatConversationList {conversations} activeId={page.params.id} />
			{:else}
				<p class="px-3 py-2 text-sm text-sage-400">Belum ada percakapan.</p>
			{/if}
		</div>
	</div>

	<div class="shrink-0 border-t border-forest-600 p-3">
		<a
			href="/asisten/pengaturan"
			aria-current={settingsActive ? 'page' : undefined}
			class="flex h-11 items-center gap-3 rounded-control px-3 text-sm font-medium
				{settingsActive ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'}"
		>
			<Settings class="size-4 shrink-0" aria-hidden="true" />
			Pengaturan AI
		</a>
	</div>
{/snippet}

<svelte:window onkeydown={(event) => event.key === 'Escape' && (panel.mobileOpen = false)} />

<aside
	id="chat-panel"
	aria-label="Riwayat chat"
	class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-forest-600 bg-forest-900
		{panel.desktopOpen ? 'md:flex' : ''}"
>
	{@render content(panel.toggleDesktop, 'Sembunyikan riwayat chat', PanelLeftClose)}
</aside>

{#if panel.mobileOpen}
	<div class="fixed inset-0 z-30 md:hidden">
		<button
			type="button"
			tabindex="-1"
			aria-label="Tutup riwayat chat"
			onclick={() => (panel.mobileOpen = false)}
			class="absolute inset-0 bg-forest-950/70"
		></button>
		<aside
			id="chat-panel-mobile"
			aria-label="Riwayat chat"
			class="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-forest-600 bg-forest-900 pb-[env(safe-area-inset-bottom)]"
		>
			{@render content(() => (panel.mobileOpen = false), 'Tutup riwayat chat', X)}
		</aside>
	</div>
{/if}

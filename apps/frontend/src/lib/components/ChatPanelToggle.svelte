<script lang="ts">
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import { getChatPanel } from '#lib/state/chat-panel.svelte.ts';

	const panel = getChatPanel();

	const buttonClass =
		'size-11 shrink-0 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800';
</script>

<button
	type="button"
	onclick={() => (panel.mobileOpen = true)}
	aria-label="Tampilkan riwayat chat"
	aria-controls="chat-panel-mobile"
	aria-expanded={panel.mobileOpen}
	class="flex md:hidden {buttonClass}"
>
	<PanelLeft class="size-5" aria-hidden="true" />
</button>
<button
	type="button"
	onclick={panel.toggleDesktop}
	aria-label={panel.desktopOpen ? 'Sembunyikan riwayat chat' : 'Tampilkan riwayat chat'}
	aria-controls="chat-panel"
	aria-expanded={panel.desktopOpen}
	class="hidden md:flex {buttonClass}"
>
	<PanelLeft class="size-5" aria-hidden="true" />
</button>

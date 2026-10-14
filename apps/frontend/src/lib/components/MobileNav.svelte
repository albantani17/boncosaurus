<script lang="ts">
	import { page } from '$app/state';
	import Plus from '@lucide/svelte/icons/plus';
	import { NAV_ITEMS, NEW_TRANSACTION_HREF } from '#lib/data/nav-items.ts';
	import { isNavItemActive } from '#lib/utils/is-nav-item-active.ts';

	const leftItems = NAV_ITEMS.slice(0, 2);
	const rightItems = NAV_ITEMS.slice(2);
</script>

{#snippet navItem(item: (typeof NAV_ITEMS)[number])}
	{@const active = isNavItemActive(page.url.pathname, item.href)}
	<a
		href={item.href}
		aria-current={active ? 'page' : undefined}
		class="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium
			{active ? 'text-dino-400' : 'text-sage-300'}"
	>
		<item.icon class="size-5" aria-hidden="true" />
		{item.label}
	</a>
{/snippet}

<nav
	aria-label="Navigasi utama"
	class="fixed inset-x-0 bottom-0 z-10 flex items-center border-t border-forest-600 bg-forest-900 px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
>
	{#each leftItems as item (item.href)}
		{@render navItem(item)}
	{/each}

	<span class="relative -mt-6 flex flex-1 justify-center">
		<a
			href={NEW_TRANSACTION_HREF}
			aria-label="Tambah transaksi"
			class="flex size-14 items-center justify-center rounded-full border-4 border-forest-900 bg-dino-400 text-forest-950 shadow-sm"
		>
			<Plus class="size-6" aria-hidden="true" />
		</a>
	</span>

	{#each rightItems as item (item.href)}
		{@render navItem(item)}
	{/each}
</nav>

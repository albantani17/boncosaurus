<script lang="ts">
	import { page } from '$app/state';
	import Plus from '@lucide/svelte/icons/plus';
	import { NAV_ITEMS } from '#lib/data/nav-items.ts';

	const leftItems = NAV_ITEMS.slice(0, 2);
	const rightItems = NAV_ITEMS.slice(2);
</script>

{#snippet navItem(item: (typeof NAV_ITEMS)[number])}
	{@const active = page.url.pathname === item.href}
	{#if item.available}
		<a
			href={item.href}
			aria-current={active ? 'page' : undefined}
			class="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium
				{active ? 'text-dino-400' : 'text-sage-300'}"
		>
			<item.icon class="size-5" aria-hidden="true" />
			{item.label}
		</a>
	{:else}
		<span
			aria-disabled="true"
			aria-label="{item.label} (segera hadir)"
			class="flex min-h-14 flex-1 cursor-not-allowed flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500"
		>
			<item.icon class="size-5" aria-hidden="true" />
			{item.label}
		</span>
	{/if}
{/snippet}

<nav
	aria-label="Navigasi utama"
	class="fixed inset-x-0 bottom-0 z-10 flex items-center border-t border-forest-600 bg-forest-900 px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
>
	{#each leftItems as item (item.href)}
		{@render navItem(item)}
	{/each}

	<span class="relative -mt-6 flex flex-1 justify-center">
		<button
			type="button"
			disabled
			aria-label="Tambah transaksi (segera hadir)"
			title="Segera hadir"
			class="flex size-14 items-center justify-center rounded-full border-4 border-forest-900 bg-forest-600 text-sage-400"
		>
			<Plus class="size-6" aria-hidden="true" />
		</button>
	</span>

	{#each rightItems as item (item.href)}
		{@render navItem(item)}
	{/each}
</nav>

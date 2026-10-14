<script lang="ts">
	import { page } from '$app/state';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { NAV_ITEMS } from '#lib/data/nav-items.ts';
	import type { PublicUser } from '#lib/types/api.types.ts';
	import BrandMark from './BrandMark.svelte';

	type Props = { user: PublicUser; workspaceName: string };

	let { user, workspaceName }: Props = $props();
</script>

<aside
	class="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-forest-600 bg-forest-900 px-3 py-5 md:flex md:w-16 lg:w-60 lg:px-4"
>
	<a href="/dashboard" class="flex justify-center px-1 lg:justify-start" aria-label="Boncosaurus">
		<span class="lg:hidden"><BrandMark showName={false} /></span>
		<span class="hidden lg:block"><BrandMark /></span>
	</a>

	<nav aria-label="Navigasi utama" class="flex flex-1 flex-col gap-1">
		{#each NAV_ITEMS as item (item.href)}
			{@const active = page.url.pathname === item.href}
			{#if item.available}
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					aria-label={item.label}
					class="flex h-11 items-center justify-center gap-3 rounded-control px-3 text-sm font-medium lg:justify-start
						{active ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'}"
				>
					<item.icon class="size-5 shrink-0" aria-hidden="true" />
					<span class="hidden lg:inline">{item.label}</span>
				</a>
			{:else}
				<span
					aria-disabled="true"
					aria-label="{item.label} (segera hadir)"
					title="Segera hadir"
					class="flex h-11 cursor-not-allowed items-center justify-center gap-3 rounded-control px-3 text-sm font-medium text-slate-500 lg:justify-start"
				>
					<item.icon class="size-5 shrink-0" aria-hidden="true" />
					<span class="hidden min-w-0 flex-1 truncate lg:inline">{item.label}</span>
					<span class="hidden rounded-full border border-forest-600 px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap lg:inline">
						Segera hadir
					</span>
				</span>
			{/if}
		{/each}
	</nav>

	<div class="flex flex-col gap-3 border-t border-forest-600 pt-4">
		<div class="hidden min-w-0 lg:block">
			<p class="truncate text-sm font-medium text-beige-100">{user.name}</p>
			<p class="truncate text-xs text-sage-400">{workspaceName}</p>
		</div>
		<form method="POST" action="/logout">
			<button
				type="submit"
				aria-label="Keluar"
				class="flex h-11 w-full items-center justify-center gap-3 rounded-control px-3 text-sm font-medium text-sage-300 hover:bg-forest-800 lg:justify-start"
			>
				<LogOut class="size-5 shrink-0" aria-hidden="true" />
				<span class="hidden lg:inline">Keluar</span>
			</button>
		</form>
	</div>
</aside>

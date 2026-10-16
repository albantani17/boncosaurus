<script lang="ts">
	import { page } from '$app/state';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { NAV_ITEMS } from '#lib/data/nav-items.ts';
	import type { DebtReminder, PublicUser } from '#lib/types/api.types.ts';
	import ReminderBell from '../debt/ReminderBell.svelte';
	import { isNavItemActive } from '#lib/domain/navigation/is-nav-item-active.ts';
	import BrandMark from './BrandMark.svelte';

	type Props = { user: PublicUser; workspaceName: string; reminders: DebtReminder[] };

	let { user, workspaceName, reminders }: Props = $props();

	const profileActive = $derived(isNavItemActive(page.url.pathname, '/profil'));

	const linkClass = (active: boolean) =>
		`flex h-11 items-center justify-center gap-3 rounded-control px-3 text-sm font-medium lg:justify-start ${
			active ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'
		}`;
</script>

<aside
	class="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-forest-600 bg-forest-900 px-3 py-5 md:flex md:w-16 lg:w-60 lg:px-4"
>
	<div class="flex flex-col items-center gap-2 lg:flex-row lg:justify-between">
		<a href="/dashboard" class="flex justify-center px-1 lg:justify-start" aria-label="Boncosaurus">
			<span class="lg:hidden"><BrandMark showName={false} /></span>
			<span class="hidden lg:block"><BrandMark /></span>
		</a>
		<ReminderBell {reminders} />
	</div>

	<nav aria-label="Navigasi utama" class="flex flex-1 flex-col gap-1">
		{#each NAV_ITEMS as item (item.href)}
			{@const active = isNavItemActive(page.url.pathname, item.href)}
			<a href={item.href} aria-current={active ? 'page' : undefined} aria-label={item.label} class={linkClass(active)}>
				<item.icon class="size-5 shrink-0" aria-hidden="true" />
				<span class="hidden lg:inline">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="flex flex-col gap-1 border-t border-forest-600 pt-4">
		<a
			href="/profil"
			aria-current={profileActive ? 'page' : undefined}
			aria-label="Profil {user.name}"
			class="flex min-h-11 items-center justify-center gap-3 rounded-control px-3 py-2 lg:justify-start
				{profileActive ? 'bg-forest-700' : 'hover:bg-forest-800'}"
		>
			<CircleUser class="size-5 shrink-0 text-sage-300" aria-hidden="true" />
			<span class="hidden min-w-0 lg:block">
				<span class="block truncate text-sm font-medium text-beige-100">{user.name}</span>
				<span class="block truncate text-xs text-sage-400">{workspaceName}</span>
			</span>
		</a>
		<form method="POST" action="/logout">
			<button type="submit" aria-label="Keluar" class="{linkClass(false)} w-full">
				<LogOut class="size-5 shrink-0" aria-hidden="true" />
				<span class="hidden lg:inline">Keluar</span>
			</button>
		</form>
	</div>
</aside>

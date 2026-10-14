<script lang="ts">
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import LogOut from '@lucide/svelte/icons/log-out';
	import AppSidebar from '#lib/components/AppSidebar.svelte';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import MobileNav from '#lib/components/MobileNav.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="min-h-dvh md:flex">
	<AppSidebar user={data.user} workspaceName={data.workspace.name} />

	<div class="min-w-0 flex-1">
		<header class="flex h-14 items-center justify-between border-b border-forest-600 bg-forest-900 px-4 md:hidden">
			<BrandMark />
			<div class="flex items-center gap-1">
			<a
				href="/profil"
				aria-label="Profil"
				class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
			>
				<CircleUser class="size-5" aria-hidden="true" />
			</a>
			<form method="POST" action="/logout">
				<button
					type="submit"
					aria-label="Keluar"
					class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
				>
					<LogOut class="size-5" aria-hidden="true" />
				</button>
			</form>
			</div>
		</header>

		<main class="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-28 md:px-6 md:pb-10 lg:px-8">
			{@render children()}
		</main>
	</div>
</div>

<MobileNav />

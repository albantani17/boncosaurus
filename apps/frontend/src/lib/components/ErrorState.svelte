<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import DinoSprite from '#lib/components/DinoSprite.svelte';
	import { describeHttpError } from '#lib/utils/describe-http-error.ts';

	type Props = { status: number; homeHref?: string; homeLabel?: string };

	let { status, homeHref = '/dashboard', homeLabel = 'Ke dashboard' }: Props = $props();

	const view = $derived(describeHttpError(status));
	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{status} · {view.title} · Boncosaurus</title>
</svelte:head>

<section class="flex flex-col items-center gap-4 px-4 py-16 text-center" aria-labelledby="error-title">
	<DinoSprite state="warning" class="h-24 w-[110px]" />
	<p class="font-mono text-5xl font-semibold tracking-tight text-dino-400">{status}</p>
	<h1 id="error-title" class="text-2xl font-semibold tracking-tight">{view.title}</h1>
	<p class="max-w-sm text-sage-300">{view.description}</p>
	<div class="mt-2 flex flex-wrap justify-center gap-3">
		{#if status === 401}
			<a href="/login" class="flex h-12 items-center rounded-control bg-dino-400 px-5 font-semibold text-forest-950 hover:brightness-110">
				Masuk
			</a>
		{:else}
			{#if view.retryable}
				<button
					type="button"
					onclick={retry}
					disabled={retrying}
					class="h-12 rounded-control bg-dino-400 px-5 font-semibold text-forest-950 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
				>
					{retrying ? 'Memuat…' : 'Coba lagi'}
				</button>
			{/if}
			<a
				href={homeHref}
				class="flex h-12 items-center rounded-control px-5 font-semibold {view.retryable
					? 'border border-forest-600 hover:bg-forest-800'
					: 'bg-dino-400 text-forest-950 hover:brightness-110'}"
			>
				{homeLabel}
			</a>
		{/if}
	</div>
</section>

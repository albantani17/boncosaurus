<script lang="ts">
	import { page } from '$app/state';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import ErrorState from '#lib/components/ErrorState.svelte';
</script>

<main class="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4">
	<BrandMark />
	<ErrorState status={page.status} />
</main>

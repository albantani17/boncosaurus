<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';

	type Props = { message: string; tone?: 'error' | 'success'; id?: string };

	let { message, tone = 'error', id }: Props = $props();
</script>

<p
	{id}
	role={tone === 'error' ? 'alert' : 'status'}
	class="flex items-start gap-2 rounded-control border bg-forest-950 px-3 py-2.5 text-sm
		{tone === 'error' ? 'border-coral-400 text-coral-400' : 'border-dino-400 text-dino-400'}"
>
	{#if tone === 'error'}
		<CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
	{:else}
		<CircleCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
	{/if}
	<span>{message}</span>
</p>

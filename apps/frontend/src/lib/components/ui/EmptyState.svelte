<script lang="ts">
	import DinoSprite from '../mascot/DinoSprite.svelte';

	type Props = { title: string; description: string };

	let { title, description }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 px-4 py-10 text-center">
	<DinoSprite class="h-20 w-[92px]" />
	<p class="font-medium text-beige-100">{title}</p>
	<p class="max-w-sm text-sm text-sage-400">{description}</p>
</div>

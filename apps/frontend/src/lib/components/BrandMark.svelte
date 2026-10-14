<script lang="ts">
	import DinoSprite from './DinoSprite.svelte';

	type Props = { showName?: boolean };

	let { showName = true }: Props = $props();
</script>

<span class="flex items-center gap-2.5">
	<DinoSprite decorative class="h-8 w-9" />
	<span class="text-lg font-semibold tracking-tight text-beige-100 {showName ? '' : 'sr-only'}">
		Boncosaurus
	</span>
</span>

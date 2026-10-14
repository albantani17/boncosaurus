<script lang="ts">
	import { DINO_DESCRIPTIONS, DINO_GRID, DINO_PALETTE, DINO_SPRITES } from '#lib/data/dino-sprites.ts';
	import type { MascotState } from '#lib/types/api.types.ts';

	type Props = { state?: MascotState; class?: string; decorative?: boolean };

	let { state = 'idle', class: className = '', decorative = false }: Props = $props();

	const pixels = $derived(
		DINO_SPRITES[state].flatMap((row, y) =>
			[...row].flatMap((symbol, x) => (symbol === '.' ? [] : [{ x, y, fill: DINO_PALETTE[symbol] }]))
		)
	);
</script>

<svg
	viewBox="0 0 {DINO_GRID.width} {DINO_GRID.height}"
	shape-rendering="crispEdges"
	class="motion-safe:animate-[dino-bob_2.4s_steps(2)_infinite] {className}"
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : DINO_DESCRIPTIONS[state]}
	aria-hidden={decorative ? 'true' : undefined}
>
	{#each pixels as pixel (`${pixel.x}-${pixel.y}`)}
		<rect x={pixel.x} y={pixel.y} width="1" height="1" fill={pixel.fill} />
	{/each}
</svg>

<style>
	@keyframes dino-bob {
		50% {
			transform: translateY(-3%);
		}
	}
</style>

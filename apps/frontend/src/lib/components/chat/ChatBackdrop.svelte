<script lang="ts">
	import { BACKDROP_PALETTE, BACKDROP_PLACEMENTS, BACKDROP_SPRITES } from '#lib/data/chat-backdrop-sprites.ts';
	import DinoSprite from '../mascot/DinoSprite.svelte';
	import PixelArt from '../mascot/PixelArt.svelte';
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
	{#each BACKDROP_PLACEMENTS as item, index (index)}
		<PixelArt
			rows={BACKDROP_SPRITES[item.sprite]}
			palette={BACKDROP_PALETTE}
			class="absolute h-auto {item.desktopOnly ? 'hidden md:block' : ''} {item.twinkle
				? 'motion-safe:animate-[backdrop-twinkle_3.2s_steps(2)_infinite]'
				: ''}"
			style="{item.position};width:{item.width};opacity:{item.opacity};transform:rotate({item.rotate ??
				0}deg);animation-delay:{index * 0.4}s"
		/>
	{/each}

	<div class="absolute top-[24%] right-[5%] hidden w-14 opacity-[0.14] lg:block">
		<DinoSprite state="happy" decorative class="h-auto w-full" />
	</div>
	<div class="absolute bottom-[22%] left-[4%] w-10 -scale-x-100 opacity-[0.13] md:w-14">
		<DinoSprite decorative class="h-auto w-full" />
	</div>

	<svg
		viewBox="0 0 320 24"
		preserveAspectRatio="xMidYMax slice"
		shape-rendering="crispEdges"
		class="absolute inset-x-0 bottom-0 h-16 w-full opacity-60"
	>
		<path
			fill="#10302d"
			d="M0 14h24v-4h24v-4h20v4h16v4h24v-6h20v-4h24v4h16v6h28v-4h24v-6h20v6h16v4h24v-2h16V24H0z"
		/>
		<path fill="#0b201f" d="M0 20h32v-4h20v-2h28v2h24v-2h28v2h20v4h36v-4h24v-2h20v2h24v4h28v-2h16V24H0z" />
	</svg>
</div>

<style>
	@keyframes -global-backdrop-twinkle {
		50% {
			opacity: 0.05;
		}
	}
</style>

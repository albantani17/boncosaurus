<script lang="ts">
	type Props = { rows: string[]; palette: Record<string, string>; class?: string; style?: string };

	let { rows, palette, class: className = '', style }: Props = $props();

	const width = $derived(Math.max(...rows.map((row) => row.length)));
	const pixels = $derived(
		rows.flatMap((row, y) =>
			[...row].flatMap((symbol, x) => (symbol in palette ? [{ x, y, fill: palette[symbol] }] : []))
		)
	);
</script>

<svg
	viewBox="0 0 {width} {rows.length}"
	shape-rendering="crispEdges"
	class={className}
	{style}
	aria-hidden="true"
>
	{#each pixels as pixel (`${pixel.x}-${pixel.y}`)}
		<rect x={pixel.x} y={pixel.y} width="1" height="1" fill={pixel.fill} />
	{/each}
</svg>

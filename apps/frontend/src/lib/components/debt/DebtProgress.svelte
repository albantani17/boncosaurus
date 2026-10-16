<script lang="ts">
	import type { DebtDirection } from '#lib/types/api.types.ts';

	type Props = { paid: number; totalDue: number; direction: DebtDirection };

	let { paid, totalDue, direction }: Props = $props();

	const percent = $derived(totalDue > 0 ? Math.min(100, Math.round((paid / totalDue) * 100)) : 0);
</script>

<div
	role="progressbar"
	aria-label="Sudah dibayar"
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={percent}
	class="h-2 w-full overflow-hidden rounded-full bg-forest-950"
>
	<div
		class="h-full rounded-full {direction === 'payable' ? 'bg-coral-400' : 'bg-dino-400'}"
		style="width: {percent}%"
	></div>
</div>

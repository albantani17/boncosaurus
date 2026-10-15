<script lang="ts">
	import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS } from '#lib/data/field-styles.ts';

	type Props = { label: string; name: string; accept: string; hint?: string };

	let { label, name, accept, hint }: Props = $props();
	const hintId = $derived(hint ? `${name}-hint` : undefined);
</script>

<div class="flex flex-col gap-1.5">
	<label for={name} class={FIELD_LABEL_CLASS}>{label}</label>
	<input
		id={name}
		{name}
		type="file"
		{accept}
		required
		aria-describedby={hintId}
		class="w-full rounded-control border border-forest-600 bg-forest-950 p-2.5 text-sm text-beige-100 file:mr-3 file:h-9 file:rounded-control file:border-0 file:bg-dino-400 file:px-4 file:font-semibold file:text-forest-950"
	/>
	{#if hint}<p id={hintId} class={FIELD_HINT_CLASS}>{hint}</p>{/if}
</div>

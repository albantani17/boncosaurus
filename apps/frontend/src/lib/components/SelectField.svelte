<script lang="ts">
	import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS, fieldInputClass } from '#lib/data/field-styles.ts';

	export type SelectOption = { value: string; label: string };

	type Props = {
		label: string;
		name: string;
		id?: string;
		value?: string;
		options: SelectOption[];
		emptyLabel?: string;
		required?: boolean;
		markOptional?: boolean;
		hint?: string;
		onchange?: (event: Event & { currentTarget: HTMLSelectElement }) => void;
	};

	let {
		label,
		name,
		id = name,
		value = $bindable(''),
		options,
		emptyLabel,
		required = true,
		markOptional = true,
		hint,
		onchange
	}: Props = $props();

	const hintId = $derived(hint ? `${id}-hint` : undefined);
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class={FIELD_LABEL_CLASS}>
		{label}
		{#if !required && markOptional}<span class="font-normal text-sage-400">(opsional)</span>{/if}
	</label>
	<select {id} {name} bind:value {required} {onchange} aria-describedby={hintId} class={fieldInputClass(false)}>
		{#if emptyLabel !== undefined}
			<option value="">{emptyLabel}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if hint}
		<p id={hintId} class={FIELD_HINT_CLASS}>{hint}</p>
	{/if}
</div>

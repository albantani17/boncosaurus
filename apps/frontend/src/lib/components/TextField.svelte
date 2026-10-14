<script lang="ts">
	import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS, fieldInputClass } from '#lib/data/field-styles.ts';

	type Props = {
		label: string;
		name: string;
		id?: string;
		type?: 'text' | 'email' | 'month' | 'datetime-local';
		value?: string;
		autocomplete?: 'username' | 'email' | 'name' | 'off';
		inputmode?: 'text' | 'numeric' | 'email';
		placeholder?: string;
		maxlength?: number;
		required?: boolean;
		invalid?: boolean;
		describedBy?: string;
		hint?: string;
	};

	let {
		label,
		name,
		id = name,
		type = 'text',
		value = $bindable(''),
		autocomplete,
		inputmode,
		placeholder,
		maxlength,
		required = true,
		invalid = false,
		describedBy,
		hint
	}: Props = $props();

	const hintId = $derived(hint ? `${id}-hint` : undefined);
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class={FIELD_LABEL_CLASS}>
		{label}
		{#if !required}<span class="font-normal text-sage-400">(opsional)</span>{/if}
	</label>
	<input
		{id}
		{name}
		{type}
		bind:value
		{autocomplete}
		{inputmode}
		{placeholder}
		{maxlength}
		{required}
		aria-invalid={invalid}
		aria-describedby={[describedBy, hintId].filter(Boolean).join(' ') || undefined}
		class={fieldInputClass(invalid)}
	/>
	{#if hint}
		<p id={hintId} class={FIELD_HINT_CLASS}>{hint}</p>
	{/if}
</div>

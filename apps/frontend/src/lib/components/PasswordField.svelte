<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS, fieldInputClass } from '#lib/data/field-styles.ts';

	type Props = {
		label: string;
		name: string;
		id?: string;
		value?: string;
		autocomplete: 'current-password' | 'new-password';
		required?: boolean;
		invalid?: boolean;
		describedBy?: string;
		hint?: string;
	};

	let {
		label,
		name,
		id = name,
		value = $bindable(''),
		autocomplete,
		required = true,
		invalid = false,
		describedBy,
		hint
	}: Props = $props();

	let visible = $state(false);
	const hintId = $derived(hint ? `${id}-hint` : undefined);
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class={FIELD_LABEL_CLASS}>{label}</label>
	<div class="relative">
		<input
			{id}
			{name}
			type={visible ? 'text' : 'password'}
			bind:value
			{autocomplete}
			{required}
			spellcheck="false"
			autocapitalize="off"
			aria-invalid={invalid}
			aria-describedby={[describedBy, hintId].filter(Boolean).join(' ') || undefined}
			class="{fieldInputClass(invalid)} pr-12"
		/>
		<button
			type="button"
			aria-controls={id}
			aria-pressed={visible}
			aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
			title={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
			onclick={() => (visible = !visible)}
			class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-control text-sage-400 hover:text-beige-100"
		>
			{#if visible}
				<EyeOff class="size-5" aria-hidden="true" />
			{:else}
				<Eye class="size-5" aria-hidden="true" />
			{/if}
		</button>
	</div>
	{#if hint}
		<p id={hintId} class={FIELD_HINT_CLASS}>{hint}</p>
	{/if}
</div>

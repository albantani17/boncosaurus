<script lang="ts">
	type Props = {
		label: string;
		name: string;
		type?: 'text' | 'email' | 'password';
		value?: string;
		autocomplete?: 'username' | 'email' | 'current-password';
		invalid?: boolean;
		describedBy?: string;
	};

	let {
		label,
		name,
		type = 'text',
		value = '',
		autocomplete,
		invalid = false,
		describedBy
	}: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
	<label for={name} class="text-sm font-medium text-sage-300">{label}</label>
	<input
		id={name}
		{name}
		{type}
		{value}
		{autocomplete}
		required
		aria-invalid={invalid}
		aria-describedby={describedBy}
		class="h-12 rounded-control border bg-forest-950 px-3.5 text-base text-beige-100 placeholder:text-slate-500
			{invalid ? 'border-coral-400' : 'border-forest-600'}"
	/>
</div>

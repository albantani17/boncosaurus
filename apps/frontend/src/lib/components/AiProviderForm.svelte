<script lang="ts">
	import { enhance } from '$app/forms';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { untrack } from 'svelte';
	import {
		AI_MODEL_SUGGESTIONS,
		AI_PROVIDER_KIND_LABELS,
		OPENAI_COMPATIBLE_PRESETS
	} from '#lib/data/ai-provider-presets.ts';
	import { FIELD_HINT_CLASS, FIELD_LABEL_CLASS, fieldInputClass } from '#lib/data/field-styles.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import { fetchProviderModels } from '#lib/services/fetch-provider-models.ts';
	import type { AiProvider, AiProviderKind } from '#lib/types/ai.types.ts';
	import FormMessage from './FormMessage.svelte';
	import PasswordField from './PasswordField.svelte';
	import SelectField from './SelectField.svelte';
	import SubmitButton from './SubmitButton.svelte';
	import TextField from './TextField.svelte';

	type Props = { provider?: AiProvider; onDone: () => void };

	let { provider, onDone }: Props = $props();

	// The dialog mounts a fresh form each time it opens, so the props are only read once.
	const initial = untrack(() => provider);
	let kindValue = $state<string>(initial?.kind ?? 'anthropic');
	const kind = $derived(kindValue as AiProviderKind);
	let name = $state(initial?.name ?? '');
	let model = $state(initial?.model ?? '');
	let baseUrl = $state(initial?.baseUrl ?? '');
	let apiKey = $state('');
	let pending = $state(false);
	let error = $state('');

	const kindOptions = Object.entries(AI_PROVIDER_KIND_LABELS).map(([value, label]) => ({ value, label }));
	const isCompatible = $derived(kind === 'openai_compatible');
	const modelListId = $props.id();

	let fetchedModels = $state<{ kind: AiProviderKind; models: string[] } | null>(null);
	let fetchingModels = $state(false);
	let modelMessage = $state('');
	// A list fetched for another provider kind no longer applies.
	const availableModels = $derived(fetchedModels?.kind === kind ? fetchedModels.models : null);

	const loadModels = async () => {
		fetchingModels = true;
		modelMessage = '';
		const result = await fetchProviderModels({
			kind,
			baseUrl,
			apiKey,
			// The stored key only belongs to the saved kind; after switching kind a new key must be typed.
			providerId: initial?.hasApiKey && initial.kind === kind ? initial.id : undefined
		});
		fetchingModels = false;
		if (!result.ok) {
			fetchedModels = null;
			modelMessage = result.message;
			return;
		}
		fetchedModels = { kind, models: result.models };
		modelMessage = result.models.length === 0 ? 'Provider tidak mengembalikan model apa pun.' : '';
		if (result.models.length > 0 && !result.models.includes(model)) model = result.models[0]!;
	};

	const applyPreset = (presetUrl: string) => {
		const preset = OPENAI_COMPATIBLE_PRESETS.find((option) => option.baseUrl === presetUrl);
		if (!preset) return;
		baseUrl = preset.baseUrl;
		if (!name) name = preset.label.replace(/ \(lokal\)$/, '');
	};
</script>

<form
	method="POST"
	action={initial ? '?/update' : '?/create'}
	class="flex flex-col gap-4"
	use:enhance={enhanceWithFeedback({
		onPending: (value) => (pending = value),
		onSuccess: onDone,
		onFailure: (message) => (error = message)
	})}
>
	{#if initial}<input type="hidden" name="id" value={initial.id} />{/if}
	{#if error}<FormMessage message={error} />{/if}

	<SelectField label="Jenis provider" name="kind" bind:value={kindValue} options={kindOptions} />

	{#if isCompatible}
		<div class="flex flex-col gap-1.5">
			<span class={FIELD_LABEL_CLASS}>Isi cepat</span>
			<div class="flex flex-wrap gap-2">
				{#each OPENAI_COMPATIBLE_PRESETS as preset (preset.baseUrl)}
					<button
						type="button"
						onclick={() => applyPreset(preset.baseUrl)}
						class="h-9 rounded-full border px-3 text-xs font-medium
							{baseUrl === preset.baseUrl
							? 'border-dino-400 text-dino-400'
							: 'border-forest-600 text-sage-300 hover:bg-forest-800'}"
					>
						{preset.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<TextField label="Nama" name="name" bind:value={name} maxlength={100} autocomplete="off" placeholder="mis. Claude kantor" />


	<TextField
		label="Base URL"
		name="baseUrl"
		bind:value={baseUrl}
		maxlength={500}
		autocomplete="off"
		required={isCompatible}
		placeholder={isCompatible ? 'http://localhost:11434/v1' : 'Kosongkan untuk alamat resmi'}
		hint={isCompatible
			? 'Di Docker, model di komputer host diakses lewat http://host.docker.internal:11434/v1.'
			: 'Isi hanya kalau memakai proxy atau gateway.'}
	/>

	<PasswordField
		label="API key"
		name="apiKey"
		bind:value={apiKey}
		autocomplete="new-password"
		required={false}
		hint={initial?.hasApiKey
			? `Tersimpan (${initial.apiKeyHint ?? '••••'}). Kosongkan untuk tetap memakai key ini.`
			: isCompatible
				? 'Opsional. Model lokal biasanya tidak butuh key.'
				: 'Disimpan terenkripsi di server dan tidak pernah ditampilkan lagi.'}
	/>

	{#if initial?.hasApiKey}
		<label class="flex items-center gap-2 text-sm text-sage-300">
			<input type="checkbox" name="clearApiKey" class="size-4 accent-dino-400" />
			Hapus API key yang tersimpan
		</label>
	{/if}

	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between gap-2">
			<label for="ai-model" class={FIELD_LABEL_CLASS}>Model</label>
			<button
				type="button"
				onclick={loadModels}
				disabled={fetchingModels || (isCompatible && !baseUrl.trim())}
				class="inline-flex h-9 items-center gap-1.5 rounded-control border border-forest-600 px-3 text-xs font-medium text-sage-300 hover:bg-forest-800 disabled:opacity-50"
			>
				<RefreshCw class="size-3.5 {fetchingModels ? 'animate-spin' : ''}" aria-hidden="true" />
				{fetchingModels ? 'Mengambil…' : 'Ambil daftar model'}
			</button>
		</div>
		{#if availableModels && availableModels.length > 0}
			<select id="ai-model" name="model" bind:value={model} required class={fieldInputClass(false)}>
				{#each availableModels as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
			<p class={FIELD_HINT_CLASS}>
				{availableModels.length} model tersedia.
				<button type="button" onclick={() => (fetchedModels = null)} class="underline hover:text-beige-100">
					Ketik manual
				</button>
			</p>
		{:else}
			<input
				id="ai-model"
				name="model"
				bind:value={model}
				list={modelListId}
				required
				maxlength={200}
				autocomplete="off"
				spellcheck="false"
				class={fieldInputClass(false)}
			/>
			<datalist id={modelListId}>
				{#each AI_MODEL_SUGGESTIONS[kind] as suggestion (suggestion)}
					<option value={suggestion}></option>
				{/each}
			</datalist>
			<p class={FIELD_HINT_CLASS}>
				Isi API key (dan base URL) dulu, lalu ambil daftar model dari provider. Atau ketik ID model persis.
			</p>
		{/if}
		{#if modelMessage}<FormMessage message={modelMessage} />{/if}
	</div>

	<SubmitButton {pending}>{initial ? 'Simpan perubahan' : 'Tambah provider'}</SubmitButton>
</form>

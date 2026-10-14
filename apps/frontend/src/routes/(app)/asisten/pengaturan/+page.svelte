<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plug from '@lucide/svelte/icons/plug';
	import Plus from '@lucide/svelte/icons/plus';
	import Star from '@lucide/svelte/icons/star';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AiProviderForm from '#lib/components/AiProviderForm.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import { AI_PROVIDER_KIND_LABELS } from '#lib/data/ai-provider-presets.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { AiProvider } from '#lib/types/ai.types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let formOpen = $state(false);
	let deleteOpen = $state(false);
	let editing = $state<AiProvider | undefined>();
	let notice = $state('');
	let error = $state('');
	let testingId = $state<string | null>(null);

	const openCreate = () => {
		editing = undefined;
		formOpen = true;
	};
	const openEdit = (provider: AiProvider) => {
		editing = provider;
		formOpen = true;
	};
	const showResult = (message: string, isError = false) => {
		notice = isError ? '' : message;
		error = isError ? message : '';
	};
</script>

<svelte:head>
	<title>Pengaturan AI · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<a href="/asisten" class="inline-flex items-center gap-1 text-sm text-sage-300 hover:text-beige-100">
			<ArrowLeft class="size-4" aria-hidden="true" /> Asisten
		</a>
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Pengaturan AI</h1>
		<p class="text-sm text-sage-300">Pilih model yang dipakai asisten: Claude, GPT, Gemini, atau model self-host.</p>
	</div>
	{#if data.aiReady && data.canManage}
		<button
			type="button"
			onclick={openCreate}
			class="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
		>
			<Plus class="size-4" aria-hidden="true" />
			Tambah<span class="max-sm:sr-only"> provider</span>
		</button>
	{/if}
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}
{#if error}<FormMessage message={error} />{/if}

{#if !data.aiReady}
	<div class="rounded-card border border-forest-600 bg-forest-900 px-5 py-2">
		<EmptyState
			title="Fitur AI belum aktif"
			description="Isi AI_SECRET_KEY di file .env server (buat dengan: openssl rand -base64 32), lalu mulai ulang backend."
		/>
	</div>
{:else if data.providers.length === 0}
	<div class="rounded-card border border-forest-600 bg-forest-900 px-5 py-2">
		<EmptyState
			title="Belum ada provider AI"
			description={data.canManage
				? 'Tambahkan provider dan API key-nya, atau sambungkan model lokal seperti Ollama.'
				: 'Minta pemilik workspace menambahkan provider AI.'}
		/>
	</div>
{:else}
	<ul class="divide-y divide-forest-600 rounded-card border border-forest-600 bg-forest-900 px-5">
		{#each data.providers as provider (provider.id)}
			<li class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
				<div class="min-w-0 flex-1">
					<p class="flex flex-wrap items-center gap-2 font-medium text-beige-100">
						<span class="truncate">{provider.name}</span>
						{#if provider.isDefault}
							<span class="rounded-full border border-dino-400 px-2 py-0.5 text-[11px] text-dino-400">Default</span>
						{/if}
					</p>
					<p class="truncate text-sm text-sage-300">
						{AI_PROVIDER_KIND_LABELS[provider.kind].split(' (')[0]} · {provider.model}
					</p>
					<p class="truncate text-xs text-sage-400">
						{provider.baseUrl ?? 'Alamat resmi'} · {provider.hasApiKey ? `API key ${provider.apiKeyHint}` : 'Tanpa API key'}
					</p>
				</div>

				{#if data.canManage}
					<div class="flex flex-wrap items-center gap-1">
						<form
							method="POST"
							action="?/test"
							use:enhance={enhanceWithFeedback({
								onPending: (value) => (testingId = value ? provider.id : null),
								onSuccess: (message) => showResult(message ?? ''),
								onFailure: (message) => showResult(message, true)
							})}
						>
							<input type="hidden" name="id" value={provider.id} />
							<button
								type="submit"
								disabled={testingId === provider.id}
								class="inline-flex h-11 items-center gap-2 rounded-control border border-forest-600 px-3 text-sm font-medium hover:bg-forest-800 disabled:opacity-60"
							>
								<Plug class="size-4" aria-hidden="true" />
								{testingId === provider.id ? 'Menguji…' : 'Tes koneksi'}
							</button>
						</form>
						{#if !provider.isDefault}
							<form
								method="POST"
								action="?/setDefault"
								use:enhance={enhanceWithFeedback({
									onSuccess: (message) => showResult(message ?? ''),
									onFailure: (message) => showResult(message, true)
								})}
							>
								<input type="hidden" name="id" value={provider.id} />
								<button
									type="submit"
									aria-label="Jadikan {provider.name} default"
									title="Jadikan default"
									class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
								>
									<Star class="size-4" aria-hidden="true" />
								</button>
							</form>
						{/if}
						<button
							type="button"
							onclick={() => openEdit(provider)}
							aria-label="Ubah {provider.name}"
							class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
						>
							<Pencil class="size-4" aria-hidden="true" />
						</button>
						<button
							type="button"
							onclick={() => {
								editing = provider;
								deleteOpen = true;
							}}
							aria-label="Hapus {provider.name}"
							class="flex size-11 items-center justify-center rounded-control text-coral-400 hover:bg-forest-800"
						>
							<Trash2 class="size-4" aria-hidden="true" />
						</button>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	<p class="text-xs text-sage-400">
		Provider default dipakai untuk percakapan baru. API key disimpan terenkripsi dan tidak pernah dikirim ke browser.
	</p>
{/if}

<Dialog bind:open={formOpen} title={editing ? 'Ubah provider AI' : 'Tambah provider AI'}>
	<AiProviderForm
		provider={editing}
		onDone={() => {
			formOpen = false;
			showResult(editing ? 'Provider AI disimpan.' : 'Provider AI ditambahkan.');
		}}
	/>
</Dialog>

{#if editing}
	<ConfirmDialog
		bind:open={deleteOpen}
		title="Hapus provider {editing.name}?"
		description="Percakapan yang memakai provider ini akan beralih ke provider default."
		action="?/delete"
		fields={{ id: editing.id }}
		onConfirmed={() => showResult('Provider AI dihapus.')}
	/>
{/if}

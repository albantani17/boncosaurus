<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import FileField from '#lib/components/FileField.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import ImportReview from '#lib/components/ImportReview.svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let pending = $state(false);
	let error = $state('');

	const preview = $derived(form && 'preview' in form ? form.preview : undefined);
	const imported = $derived(form && 'imported' in form ? form.imported : undefined);
	const failure = $derived(form && 'message' in form && !preview && !imported ? String(form.message) : '');
</script>

<svelte:head>
	<title>Impor transaksi · Boncosaurus</title>
</svelte:head>

<div class="flex flex-col gap-2">
	<a href="/transaksi" class="inline-flex items-center gap-1.5 text-sm text-sage-300 hover:text-beige-100">
		<ArrowLeft class="size-4" aria-hidden="true" />
		Kembali ke transaksi
	</a>
	<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Impor transaksi</h1>
</div>

{#if imported}
	<section class="flex flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5">
		<FormMessage
			tone="success"
			message="{imported.createdTransactions} transaksi diimpor{imported.createdAccounts > 0
				? `, ${imported.createdAccounts} akun baru`
				: ''}{imported.createdCategories > 0 ? `, ${imported.createdCategories} kategori baru` : ''}."
		/>
		<div class="flex gap-3">
			<a href="/transaksi" class="flex h-12 items-center rounded-control bg-dino-400 px-5 font-semibold text-forest-950 hover:brightness-110">
				Lihat transaksi
			</a>
			<a href="/transaksi/impor" class="flex h-12 items-center rounded-control border border-forest-600 px-5 font-medium hover:bg-forest-800">
				Impor file lain
			</a>
		</div>
	</section>
{:else if preview}
	{#key preview}
		<ImportReview {preview} accounts={data.accounts} categories={data.categories} currency={data.workspace.baseCurrency} />
	{/key}
{:else}
	<form
		method="POST"
		action="?/preview"
		enctype="multipart/form-data"
		use:enhance={enhanceWithFeedback({
			prepare: (formData) => {
				error = '';
				formData.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
				formData.set('utcOffsetMinutes', String(-new Date().getTimezoneOffset()));
			},
			onPending: (value) => (pending = value),
			onFailure: (message) => (error = message)
		})}
		class="flex max-w-xl flex-col gap-4 rounded-card border border-forest-600 bg-forest-900 p-5"
	>
		<FileField
			label="File"
			name="file"
			accept=".csv,.tsv,.xlsx,.pdf,.json,.txt"
			hint="CSV, TSV, XLSX, PDF (berisi teks), JSON, atau TXT. Maksimal 5 MB dan 2.000 transaksi."
		/>
		<p class="text-xs text-sage-400">
			Isi file dikirim ke provider AI yang kamu atur di Pengaturan AI untuk dibaca. Kamu bisa memeriksa hasilnya sebelum
			diimpor.
		</p>
		{#if error || failure}<FormMessage message={error || failure} />{/if}
		<SubmitButton {pending}>Baca file</SubmitButton>
	</form>
{/if}

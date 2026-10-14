<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import ChatConversationList from '#lib/components/ChatConversationList.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const canStart = $derived(data.aiReady && data.providers.length > 0);
</script>

<svelte:head>
	<title>Asisten · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Asisten</h1>
		<p class="text-sm text-sage-300">Tanya soal keuanganmu atau catat transaksi lewat chat.</p>
	</div>
	<a
		href="/asisten/pengaturan"
		class="inline-flex h-11 shrink-0 items-center gap-2 rounded-control border border-forest-600 px-4 text-sm font-medium hover:bg-forest-800"
	>
		<Settings class="size-4" aria-hidden="true" />
		<span class="max-sm:sr-only">Pengaturan AI</span>
	</a>
</div>

{#if form?.message}<FormMessage message={form.message} />{/if}

<div class="rounded-card border border-forest-600 bg-forest-900 p-4 md:max-w-2xl">
	{#if !data.aiReady}
		<EmptyState
			title="Fitur AI belum aktif"
			description="Isi AI_SECRET_KEY di file .env server (buat dengan: openssl rand -base64 32), lalu mulai ulang backend."
		/>
	{:else if data.providers.length === 0}
		<EmptyState
			title="Belum ada provider AI"
			description="Buka Pengaturan AI untuk menyambungkan Claude, GPT, Gemini, atau model self-host seperti Ollama."
		/>
	{:else}
		<ChatConversationList conversations={data.conversations} {canStart} />
		{#if data.conversations.length === 0}
			<EmptyState title="Belum ada percakapan" description="Mulai percakapan baru untuk bertanya ke asisten." />
		{/if}
	{/if}
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import Settings from '@lucide/svelte/icons/settings';
	import ChatComposer from '#lib/components/chat/ChatComposer.svelte';
	import ChatModelSelect from '#lib/components/chat/ChatModelSelect.svelte';
	import ChatShell from '#lib/components/chat/ChatShell.svelte';
	import ChatWelcome from '#lib/components/chat/ChatWelcome.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import { setPendingChatMessage } from '#lib/services/chat/pending-chat-message.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const canChat = $derived(data.aiReady && data.providers.length > 0);
	const defaultProviderId = $derived(data.providers.find((provider) => provider.isDefault)?.id ?? '');

	let providerId = $derived(defaultProviderId);
	let draftText = $state('');
	let sentText = '';
	let creating = $state(false);
	let error = $state('');
	let newForm = $state<HTMLFormElement>();

	// The conversation is created first; /asisten/[id] then sends this text as its first message.
	const send = (text: string) => {
		sentText = text;
		error = '';
		setPendingChatMessage(text);
		newForm?.requestSubmit();
	};
</script>

<svelte:head>
	<title>Asisten · Boncosaurus</title>
</svelte:head>

<ChatShell title="Pesan baru">
	{#if !data.aiReady}
		<div class="my-auto">
			<EmptyState
				title="Fitur AI belum aktif"
				description="Isi AI_SECRET_KEY di file .env server (buat dengan: openssl rand -base64 32), lalu mulai ulang backend."
			/>
		</div>
	{:else if data.providers.length === 0}
		<div class="my-auto flex flex-col items-center">
			<EmptyState
				title="Belum ada provider AI"
				description="Buka Pengaturan AI untuk menyambungkan Claude, GPT, Gemini, atau model self-host seperti Ollama."
			/>
			<a
				href="/asisten/pengaturan"
				class="inline-flex h-11 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
			>
				<Settings class="size-4" aria-hidden="true" />
				Pengaturan AI
			</a>
		</div>
	{:else}
		<ChatWelcome disabled={creating} onPick={send} />
	{/if}

	{#snippet footer()}
		{#if canChat}
			{#if error}<FormMessage message={error} />{/if}
			<form
				bind:this={newForm}
				method="POST"
				action="?/new"
				hidden
				use:enhance={enhanceWithFeedback({
					onPending: (value) => (creating = value),
					onFailure: (message) => {
						setPendingChatMessage(null);
						draftText = sentText;
						error = message;
					}
				})}
			>
				<input type="hidden" name="providerId" value={providerId} />
			</form>
			<ChatComposer bind:value={draftText} busy={creating} onSend={send} />
			<ChatModelSelect providers={data.providers} bind:value={providerId} />
		{/if}
	{/snippet}
</ChatShell>

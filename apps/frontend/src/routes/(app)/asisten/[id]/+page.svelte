<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Chat } from '@ai-sdk/svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { DefaultChatTransport, type UIMessage } from 'ai';
	import { tick, untrack } from 'svelte';
	import ChatComposer from '#lib/components/ChatComposer.svelte';
	import ChatConversationList from '#lib/components/ChatConversationList.svelte';
	import ChatMessage from '#lib/components/ChatMessage.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import DinoSprite from '#lib/components/DinoSprite.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { CHAT_SUGGESTIONS } from '#lib/data/chat-tool-labels.ts';
	import { fieldInputClass } from '#lib/data/field-styles.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const defaultProviderId = $derived(data.providers.find((provider) => provider.isDefault)?.id ?? '');

	let providerId = $derived(data.conversation.providerId ?? defaultProviderId);
	let draftText = $state('');
	let renameOpen = $state(false);
	let deleteOpen = $state(false);
	let renameTitle = $state('');
	let renamePending = $state(false);
	let renameError = $state('');
	let endOfMessages = $state<HTMLElement>();

	// One Chat per conversation; reloading page data (titles, drafts) must not reset a live stream.
	const chat = $derived.by(() => {
		const conversationId = data.conversation.id;
		return untrack(
			() =>
				new Chat({
					id: conversationId,
					messages: data.conversation.messages as UIMessage[],
					transport: new DefaultChatTransport({
						api: `/asisten/${conversationId}/stream`,
						prepareSendMessagesRequest: ({ messages }) => ({
							body: { message: messages.at(-1), providerId: providerId || undefined, timeZone }
						})
					}),
					onFinish: () => invalidate('app:conversations')
				})
		);
	});

	const busy = $derived(chat.status === 'submitted' || chat.status === 'streaming');
	const canChat = $derived(data.providers.length > 0);
	const providerOptions = $derived(
		data.providers.map((provider) => ({ value: provider.id, label: `${provider.name} · ${provider.model}` }))
	);
	const streamSize = $derived(JSON.stringify(chat.messages.at(-1)?.parts ?? []).length);

	$effect(() => {
		void streamSize;
		void chat.messages.length;
		const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 240;
		if (nearBottom) tick().then(() => endOfMessages?.scrollIntoView({ block: 'end' }));
	});

	const send = (text: string) => chat.sendMessage({ text });

	const resolveProposal = (messageId: string, toolCallId: string, status: 'saved' | 'dismissed') => {
		chat.messages = chat.messages.map((message) =>
			message.id !== messageId
				? message
				: {
						...message,
						parts: message.parts.map((part) =>
							'toolCallId' in part && part.toolCallId === toolCallId && part.state === 'output-available'
								? ({ ...part, output: { ...(part.output as object), status } } as typeof part)
								: part
						)
					}
		);
	};
</script>

<svelte:head>
	<title>{data.conversation.title ?? 'Percakapan baru'} · Asisten · Boncosaurus</title>
</svelte:head>

<div class="grid gap-6 lg:grid-cols-[16rem_1fr]">
	<aside class="hidden lg:block">
		<div class="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto">
			<ChatConversationList conversations={data.conversations} activeId={data.conversation.id} canStart={canChat} />
		</div>
	</aside>

	<section class="flex min-w-0 flex-col gap-4" aria-label="Percakapan">
		<header class="flex flex-wrap items-center gap-2">
			<a
				href="/asisten"
				aria-label="Kembali ke riwayat percakapan"
				class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800 lg:hidden"
			>
				<ArrowLeft class="size-5" aria-hidden="true" />
			</a>
			<h1 class="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight lg:text-xl">
				{data.conversation.title ?? 'Percakapan baru'}
			</h1>
			<button
				type="button"
				onclick={() => {
					renameTitle = data.conversation.title ?? '';
					renameError = '';
					renameOpen = true;
				}}
				aria-label="Ubah judul"
				class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
			>
				<Pencil class="size-4" aria-hidden="true" />
			</button>
			<button
				type="button"
				onclick={() => (deleteOpen = true)}
				aria-label="Hapus percakapan"
				class="flex size-11 items-center justify-center rounded-control text-coral-400 hover:bg-forest-800"
			>
				<Trash2 class="size-4" aria-hidden="true" />
			</button>
			<a
				href="/asisten/pengaturan"
				aria-label="Pengaturan AI"
				class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
			>
				<Settings class="size-4" aria-hidden="true" />
			</a>
		</header>

		{#if chat.messages.length === 0}
			<div class="flex flex-col items-center gap-4 rounded-card border border-forest-600 bg-forest-900 px-4 py-8 text-center">
				<DinoSprite class="h-20 w-[92px]" />
				<div class="flex flex-col gap-1">
					<p class="font-medium text-beige-100">Halo! Ada yang bisa kubantu?</p>
					<p class="max-w-md text-sm text-sage-400">
						Aku bisa membaca ringkasan, saldo, dan transaksimu, juga menyiapkan transaksi baru untuk kamu simpan.
					</p>
				</div>
				<div class="flex flex-wrap justify-center gap-2">
					{#each CHAT_SUGGESTIONS as suggestion (suggestion)}
						<button
							type="button"
							disabled={!canChat}
							onclick={() => send(suggestion)}
							class="rounded-full border border-forest-600 px-3 py-2 text-xs text-sage-300 hover:bg-forest-800 disabled:opacity-50"
						>
							{suggestion}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<ol class="flex flex-col gap-5">
				{#each chat.messages as message (message.id)}
					<ChatMessage
						{message}
						accounts={data.accounts}
						categories={data.categories}
						interactive={!busy}
						onProposalResolved={(toolCallId, status) => resolveProposal(message.id, toolCallId, status)}
					/>
				{/each}
			</ol>
		{/if}

		{#if chat.status === 'submitted'}
			<p class="text-sm text-sage-400" role="status">Asisten sedang berpikir…</p>
		{/if}
		{#if chat.error}
			<FormMessage message={chat.error.message || 'Asisten gagal menjawab. Coba lagi.'} />
		{/if}

		<div bind:this={endOfMessages} class="sticky bottom-20 flex flex-col gap-2 bg-forest-950 pt-2 md:bottom-0 md:pb-4">
			<ChatComposer bind:value={draftText} {busy} disabled={!canChat} onSend={send} onStop={() => chat.stop()} />
			{#if providerOptions.length > 1}
				<label class="flex items-center gap-2 text-xs text-sage-400">
					Model
					<select bind:value={providerId} class="{fieldInputClass(false)} h-9 max-w-xs py-0 text-xs">
						{#each providerOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>
			{/if}
			<p class="text-[11px] text-sage-400">Asisten bisa keliru. Periksa lagi sebelum menyimpan transaksi.</p>
		</div>
	</section>
</div>

<Dialog bind:open={renameOpen} title="Ubah judul percakapan">
	<form
		method="POST"
		action="?/rename"
		class="flex flex-col gap-4"
		use:enhance={enhanceWithFeedback({
			onPending: (value) => (renamePending = value),
			onSuccess: () => (renameOpen = false),
			onFailure: (message) => (renameError = message)
		})}
	>
		{#if renameError}<FormMessage message={renameError} />{/if}
		<TextField label="Judul" name="title" bind:value={renameTitle} maxlength={100} autocomplete="off" />
		<SubmitButton pending={renamePending}>Simpan</SubmitButton>
	</form>
</Dialog>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Hapus percakapan ini?"
	description="Riwayat chat akan dihapus. Transaksi yang sudah disimpan tetap ada."
	action="?/delete"
	fields={{}}
/>

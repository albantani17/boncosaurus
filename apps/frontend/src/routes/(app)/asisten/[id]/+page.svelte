<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Chat } from '@ai-sdk/svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { DefaultChatTransport, type UIMessage } from 'ai';
	import { onMount, tick, untrack } from 'svelte';
	import ChatComposer from '#lib/components/ChatComposer.svelte';
	import ChatMessage from '#lib/components/ChatMessage.svelte';
	import ChatModelSelect from '#lib/components/ChatModelSelect.svelte';
	import ChatShell from '#lib/components/ChatShell.svelte';
	import ChatWelcome from '#lib/components/ChatWelcome.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import { takePendingChatMessage } from '#lib/services/pending-chat-message.ts';
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
	let scroller = $state<HTMLElement>();

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
	const title = $derived(data.conversation.title ?? 'Percakapan baru');
	const streamSize = $derived(JSON.stringify(chat.messages.at(-1)?.parts ?? []).length);

	$effect(() => {
		void streamSize;
		void chat.messages.length;
		if (!scroller) return;
		const nearBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 240;
		if (nearBottom) tick().then(() => scroller?.scrollTo({ top: scroller.scrollHeight }));
	});

	const send = (text: string) => chat.sendMessage({ text });

	// A conversation started from /asisten arrives here with its first message still to send.
	onMount(() => {
		const pending = takePendingChatMessage();
		if (pending) send(pending);
	});

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
	<title>{title} · Asisten · Boncosaurus</title>
</svelte:head>

<ChatShell {title} bind:scroller>
	{#snippet actions()}
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
	{/snippet}

	{#if chat.messages.length === 0}
		<ChatWelcome disabled={!canChat || busy} onPick={send} />
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
		<p class="mt-4 text-sm text-sage-400" role="status">Asisten sedang berpikir…</p>
	{/if}
	{#if chat.error}
		<div class="mt-4">
			<FormMessage message={chat.error.message || 'Asisten gagal menjawab. Coba lagi.'} />
		</div>
	{/if}

	{#snippet footer()}
		<ChatComposer bind:value={draftText} {busy} disabled={!canChat} onSend={send} onStop={() => chat.stop()} />
		<ChatModelSelect providers={data.providers} bind:value={providerId} />
	{/snippet}
</ChatShell>

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

<script lang="ts">
	import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
	import Square from '@lucide/svelte/icons/square';

	type Props = {
		value?: string;
		busy: boolean;
		disabled?: boolean;
		onSend: (text: string) => void;
		onStop?: () => void;
	};

	let { value = $bindable(''), busy, disabled = false, onSend, onStop }: Props = $props();

	const MAX_LENGTH = 4000;
	const canSend = $derived(!busy && !disabled && value.trim().length > 0);

	const submit = (event?: SubmitEvent) => {
		event?.preventDefault();
		if (!canSend) return;
		onSend(value.trim());
		value = '';
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			submit();
		}
	};
</script>

<form
	onsubmit={submit}
	class="flex items-end gap-2 rounded-card border border-forest-600 bg-forest-900 p-2 focus-within:border-dino-400"
>
	<label for="chat-input" class="sr-only">Pesan untuk asisten</label>
	<textarea
		id="chat-input"
		bind:value
		onkeydown={handleKeydown}
		rows="1"
		maxlength={MAX_LENGTH}
		{disabled}
		placeholder={disabled ? 'Tambahkan provider AI dulu di pengaturan.' : 'Tanya soal keuanganmu atau catat transaksi…'}
		class="max-h-48 min-h-11 flex-1 resize-none [field-sizing:content] bg-transparent px-2 py-2.5 text-sm text-beige-100 placeholder:text-sage-400 focus:outline-none"
	></textarea>
	{#if busy && onStop}
		<button
			type="button"
			onclick={onStop}
			aria-label="Hentikan jawaban"
			class="flex size-11 shrink-0 items-center justify-center rounded-control border border-forest-600 text-sage-300 hover:bg-forest-800"
		>
			<Square class="size-4" aria-hidden="true" />
		</button>
	{:else}
		<button
			type="submit"
			disabled={!canSend}
			aria-label="Kirim pesan"
			class="flex size-11 shrink-0 items-center justify-center rounded-control bg-dino-400 text-forest-950 hover:brightness-110 disabled:opacity-40"
		>
			<SendHorizontal class="size-4" aria-hidden="true" />
		</button>
	{/if}
</form>

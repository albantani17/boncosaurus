<script lang="ts">
	import Bell from '@lucide/svelte/icons/bell';
	import type { DebtReminder } from '#lib/types/api.types.ts';
	import Dialog from '../ui/Dialog.svelte';
	import DebtReminderList from './DebtReminderList.svelte';

	type Props = { reminders: DebtReminder[]; class?: string };

	let { reminders, class: className = '' }: Props = $props();

	let open = $state(false);
	const hasOverdue = $derived(reminders.some((reminder) => reminder.daysUntil < 0));
	const label = $derived(reminders.length > 0 ? `Pengingat, ${reminders.length} jatuh tempo` : 'Pengingat');
</script>

<button
	type="button"
	onclick={() => (open = true)}
	aria-label={label}
	class="relative flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800 {className}"
>
	<Bell class="size-5" aria-hidden="true" />
	{#if reminders.length > 0}
		<span
			class="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold text-forest-950
				{hasOverdue ? 'bg-amber-400' : 'bg-dino-400'}"
		>
			{reminders.length}
		</span>
	{/if}
</button>

<Dialog bind:open title="Pengingat jatuh tempo">
	{#if reminders.length === 0}
		<p class="text-sm text-sage-400">Tidak ada hutang atau piutang yang segera jatuh tempo.</p>
	{:else}
		<DebtReminderList {reminders} onNavigate={() => (open = false)} />
	{/if}
	<a href="/profil#notifikasi" onclick={() => (open = false)} class="text-sm text-sage-300 underline hover:text-beige-100">
		Atur notifikasi browser
	</a>
</Dialog>

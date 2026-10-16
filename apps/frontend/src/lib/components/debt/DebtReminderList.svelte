<script lang="ts">
	import type { DebtReminder } from '#lib/types/api.types.ts';
	import { describeReminder } from '#lib/domain/debt/describe-reminder.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { reminders: DebtReminder[]; onNavigate?: () => void };

	let { reminders, onNavigate }: Props = $props();
</script>

<ul class="divide-y divide-forest-600">
	{#each reminders as reminder (reminder.debtId)}
		{@const text = describeReminder(reminder)}
		<li>
			<a
				href="/hutang/{reminder.debtId}"
				onclick={onNavigate}
				class="-mx-2 flex items-center justify-between gap-3 rounded-control px-2 py-3 hover:bg-forest-800"
			>
				<span class="min-w-0">
					<span class="block truncate text-sm text-beige-100">{text.action}</span>
					<span class="block truncate text-xs text-sage-400">{reminder.title}</span>
				</span>
				<span class="shrink-0 text-right">
					<span class="block text-sm font-medium tabular-nums">{formatCurrency(reminder.amount, reminder.currency)}</span>
					<span class="block text-xs {text.isOverdue ? 'text-amber-400' : 'text-sage-400'}">{text.when}</span>
				</span>
			</a>
		</li>
	{/each}
</ul>

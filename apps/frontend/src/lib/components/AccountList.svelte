<script lang="ts">
	import { ACCOUNT_TYPE_LABELS } from '#lib/data/account-type-labels.ts';
	import type { Account } from '#lib/types/api.types.ts';
	import { formatCurrency } from '#lib/utils/format-currency.ts';

	type Props = { accounts: Account[] };

	let { accounts }: Props = $props();

</script>

{#if accounts.length === 0}
	<p class="py-6 text-center text-sm text-sage-400">Belum ada akun.</p>
{:else}
	<ul class="flex flex-col divide-y divide-forest-600">
		{#each accounts as account (account.id)}
			<li class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
				<div class="min-w-0">
					<p class="truncate text-sm font-medium text-beige-100">{account.name}</p>
					<p class="text-xs text-sage-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>
				</div>
				<p class="shrink-0 text-sm font-medium tabular-nums text-beige-100">
					{formatCurrency(account.balance, account.currency)}
				</p>
			</li>
		{/each}
	</ul>
{/if}

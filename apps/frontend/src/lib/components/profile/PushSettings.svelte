<script lang="ts">
	import { onMount } from 'svelte';
	import type { PushConfig } from '#lib/types/api.types.ts';
	import {
		type BrowserPushState,
		disableBrowserPush,
		enableBrowserPush,
		readBrowserPushState,
		sendTestPush
	} from '#lib/services/push/browser-push.ts';
	import type { PushCallResult } from '#lib/services/push/call-push-endpoint.ts';
	import FormMessage from '../ui/FormMessage.svelte';

	type Props = { config: PushConfig };

	let { config }: Props = $props();

	let pushState = $state<BrowserPushState | 'loading'>('loading');
	let busy = $state(false);
	let feedback = $state<{ tone: 'error' | 'success'; message: string } | null>(null);

	const refresh = async () => {
		pushState = await readBrowserPushState().catch(() => 'unsupported' as const);
	};

	onMount(refresh);

	async function run(action: () => Promise<PushCallResult>, success: string) {
		busy = true;
		feedback = null;
		try {
			const result = await action();
			feedback = result.ok ? { tone: 'success', message: success } : { tone: 'error', message: result.message };
		} catch {
			feedback = { tone: 'error', message: 'Browser menolak berlangganan notifikasi. Coba lagi.' };
		}
		await refresh();
		busy = false;
	}

	const buttonClass =
		'inline-flex h-11 items-center justify-center rounded-control px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70';
</script>

<section id="notifikasi" aria-labelledby="push-heading" class="rounded-card border border-forest-600 bg-forest-900 p-5 sm:p-6">
	<h2 id="push-heading" class="mb-1 text-base font-semibold">Notifikasi pengingat</h2>
	<p class="mb-4 text-sm text-sage-300">
		Kirim ringkasan hutang & piutang yang segera jatuh tempo ke browser ini, sekali sehari, walau aplikasinya tertutup.
	</p>

	{#if feedback}<div class="mb-4"><FormMessage tone={feedback.tone} message={feedback.message} /></div>{/if}

	{#if !config.enabled || !config.publicKey}
		<p class="text-sm text-sage-400">Notifikasi browser belum diaktifkan di server (VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY).</p>
	{:else if pushState === 'loading'}
		<p class="text-sm text-sage-400">Memeriksa browser…</p>
	{:else if pushState === 'unsupported'}
		<p class="text-sm text-sage-400">
			Browser ini tidak mendukung notifikasi push. Di iPhone, tambahkan aplikasi ke Layar Utama dulu. Push juga butuh HTTPS.
		</p>
	{:else if pushState === 'denied'}
		<p class="text-sm text-sage-400">Izin notifikasi diblokir. Izinkan lewat pengaturan situs di browser, lalu muat ulang.</p>
	{:else if pushState === 'on'}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				disabled={busy}
				onclick={() => run(sendTestPush, 'Notifikasi tes dikirim.')}
				class="{buttonClass} bg-dino-400 text-forest-950 hover:brightness-110"
			>
				Kirim tes
			</button>
			<button
				type="button"
				disabled={busy}
				onclick={() => run(disableBrowserPush, 'Notifikasi di browser ini dimatikan.')}
				class="{buttonClass} border border-forest-600 font-medium text-beige-100 hover:bg-forest-800"
			>
				Matikan
			</button>
		</div>
	{:else}
		{@const publicKey = config.publicKey}
		<button
			type="button"
			disabled={busy}
			onclick={() => run(() => enableBrowserPush(publicKey), 'Notifikasi aktif di browser ini.')}
			class="{buttonClass} bg-dino-400 text-forest-950 hover:brightness-110"
		>
			Aktifkan notifikasi
		</button>
	{/if}
</section>

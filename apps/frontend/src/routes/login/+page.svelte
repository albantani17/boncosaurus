<script lang="ts">
	import { enhance } from '$app/forms';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import DinoSprite from '#lib/components/DinoSprite.svelte';
	import ForestBanner from '#lib/components/ForestBanner.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import PasswordField from '#lib/components/PasswordField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Masuk · Boncosaurus</title>
</svelte:head>

<div class="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
	<section class="relative flex min-h-48 items-end overflow-hidden bg-forest-900 lg:min-h-0 lg:items-center">
		<ForestBanner />
		<div class="relative flex w-full items-end justify-between gap-4 p-6 lg:flex-col lg:items-start lg:justify-center lg:gap-8 lg:p-14">
			<div class="flex flex-col gap-2">
				<h2 class="hidden max-w-sm text-3xl font-semibold tracking-tight text-beige-100 lg:block">
					Catat keuanganmu dengan tenang.
				</h2>
				<p class="hidden max-w-sm text-sage-300 lg:block">
					Pantau saldo, pemasukan, dan pengeluaran dalam satu tempat yang rapi.
				</p>
			</div>
			<DinoSprite class="h-24 w-[110px] shrink-0 lg:h-44 lg:w-[200px]" decorative />
		</div>
	</section>

	<main class="flex items-center justify-center px-4 py-10 sm:px-8">
		<div class="flex w-full max-w-sm flex-col gap-8">
			<BrandMark />

			<div class="flex flex-col gap-1">
				<h1 class="text-2xl font-semibold tracking-tight">Masuk</h1>
				<p class="text-sm text-sage-300">Gunakan akun yang terdaftar di Boncosaurus kamu.</p>
			</div>

			<form
				method="POST"
				novalidate
				class="flex flex-col gap-5 rounded-card border border-forest-600 bg-forest-800 p-5 sm:p-6"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				{#if form?.message}
					<FormMessage id="login-error" message={form.message} />
				{/if}

				<TextField
					label="Email"
					name="email"
					type="email"
					autocomplete="email"
					value={form?.email ?? ''}
					invalid={Boolean(form?.message)}
					describedBy={form?.message ? 'login-error' : undefined}
				/>
				<PasswordField
					label="Kata sandi"
					name="password"
					autocomplete="current-password"
					invalid={Boolean(form?.message)}
					describedBy={form?.message ? 'login-error' : undefined}
				/>

				<button
					type="submit"
					disabled={submitting}
					class="h-12 rounded-control bg-dino-400 font-semibold text-forest-950 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
				>
					{submitting ? 'Memproses…' : 'Masuk'}
				</button>
			</form>
		</div>
	</main>
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import PushSettings from '#lib/components/profile/PushSettings.svelte';
	import FormMessage from '#lib/components/ui/FormMessage.svelte';
	import PasswordField from '#lib/components/ui/PasswordField.svelte';
	import SubmitButton from '#lib/components/ui/SubmitButton.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import { MIN_PASSWORD_LENGTH } from '@boncosaurus/shared';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Feedback = { tone: 'error' | 'success'; message: string } | null;

	let name = $state(untrack(() => data.user.name));
	let email = $state(untrack(() => data.user.email));
	let profileCurrentPassword = $state('');
	let profilePending = $state(false);
	let profileFeedback = $state<Feedback>(null);
	const isChangingEmail = $derived(email.trim().toLowerCase() !== data.user.email);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordPending = $state(false);
	let passwordFeedback = $state<Feedback>(null);
</script>

<svelte:head>
	<title>Profil · Boncosaurus</title>
</svelte:head>

<div class="flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Profil</h1>
	<p class="text-sm text-sage-300">Atur data diri dan kata sandi akunmu.</p>
</div>

<div class="grid gap-4 lg:grid-cols-2 lg:items-start">
	<section aria-labelledby="profile-heading" class="rounded-card border border-forest-600 bg-forest-900 p-5 sm:p-6">
		<h2 id="profile-heading" class="mb-4 text-base font-semibold">Data diri</h2>
		<form
			method="POST"
			action="?/profile"
			class="flex flex-col gap-4"
			use:enhance={enhanceWithFeedback({
				onPending: (value) => (profilePending = value),
				onSuccess: (message) => {
					profileCurrentPassword = '';
					profileFeedback = { tone: 'success', message: message ?? 'Profil disimpan.' };
				},
				onFailure: (message) => (profileFeedback = { tone: 'error', message })
			})}
		>
			{#if profileFeedback}<FormMessage tone={profileFeedback.tone} message={profileFeedback.message} />{/if}
			<TextField label="Nama" name="name" bind:value={name} maxlength={100} autocomplete="name" />
			<TextField label="Email" name="email" type="email" bind:value={email} autocomplete="email" inputmode="email" />
			{#if isChangingEmail}
				<PasswordField
					label="Kata sandi saat ini"
					name="currentPassword"
					id="profile-current-password"
					bind:value={profileCurrentPassword}
					autocomplete="current-password"
					hint="Dibutuhkan untuk mengganti email, karena email dipakai untuk masuk."
				/>
			{/if}
			<SubmitButton pending={profilePending}>Simpan profil</SubmitButton>
		</form>
	</section>

	<section aria-labelledby="password-heading" class="rounded-card border border-forest-600 bg-forest-900 p-5 sm:p-6">
		<h2 id="password-heading" class="mb-1 text-base font-semibold">Ganti kata sandi</h2>
		<p class="mb-4 text-sm text-sage-400">Setelah diganti, semua perangkat lain akan otomatis keluar.</p>
		<form
			method="POST"
			action="?/password"
			class="flex flex-col gap-4"
			use:enhance={enhanceWithFeedback({
				onPending: (value) => (passwordPending = value),
				onSuccess: (message) => {
					currentPassword = newPassword = confirmPassword = '';
					passwordFeedback = { tone: 'success', message: message ?? 'Kata sandi diganti.' };
				},
				onFailure: (message) => (passwordFeedback = { tone: 'error', message })
			})}
		>
			{#if passwordFeedback}<FormMessage tone={passwordFeedback.tone} message={passwordFeedback.message} />{/if}
			<PasswordField
				label="Kata sandi saat ini"
				name="currentPassword"
				bind:value={currentPassword}
				autocomplete="current-password"
			/>
			<PasswordField
				label="Kata sandi baru"
				name="newPassword"
				bind:value={newPassword}
				autocomplete="new-password"
				hint="Minimal {MIN_PASSWORD_LENGTH} karakter."
			/>
			<PasswordField
				label="Ulangi kata sandi baru"
				name="confirmPassword"
				bind:value={confirmPassword}
				autocomplete="new-password"
			/>
			<SubmitButton pending={passwordPending}>Ganti kata sandi</SubmitButton>
		</form>
	</section>
</div>

<PushSettings config={data.pushConfig} />

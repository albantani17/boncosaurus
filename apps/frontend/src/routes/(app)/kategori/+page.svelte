<script lang="ts">
	import { enhance } from '$app/forms';
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import CategoryForm from '#lib/components/CategoryForm.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FormMessage from '#lib/components/FormMessage.svelte';
	import { CATEGORY_TYPE_LABELS } from '#lib/data/category-type-labels.ts';
	import { enhanceWithFeedback } from '#lib/forms/enhance-with-feedback.ts';
	import type { Category, CategoryType } from '#lib/types/api.types.ts';
	import { buildCategoryTree } from '#lib/utils/build-category-tree.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const TABS: CategoryType[] = ['expense', 'income'];

	let activeType = $state<CategoryType>('expense');
	const tree = $derived(buildCategoryTree(data.categories, activeType));

	let formOpen = $state(false);
	let deleteOpen = $state(false);
	let editing = $state<Category | undefined>();
	let presetParentId = $state<string | undefined>();
	let notice = $state('');
	let actionError = $state('');

	const openCreate = (parentId?: string) => {
		editing = undefined;
		presetParentId = parentId;
		formOpen = true;
	};
	const openEdit = (category: Category) => {
		editing = category;
		actionError = '';
		formOpen = true;
	};
	const finish = (message: string) => {
		formOpen = false;
		notice = message;
	};
	const formTitle = $derived(
		editing ? 'Ubah kategori' : presetParentId ? 'Tambah subkategori' : `Tambah kategori ${CATEGORY_TYPE_LABELS[activeType].toLowerCase()}`
	);
</script>

<svelte:head>
	<title>Kategori · Boncosaurus</title>
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight lg:text-3xl">Kategori</h1>
		<p class="text-sm text-sage-300">Kelompokkan pemasukan dan pengeluaranmu.</p>
	</div>
	<button
		type="button"
		onclick={() => openCreate()}
		class="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-dino-400 px-4 text-sm font-semibold text-forest-950 hover:brightness-110"
	>
		<Plus class="size-4" aria-hidden="true" />
		Tambah<span class="max-sm:sr-only"> kategori</span>
	</button>
</div>

{#if notice}<FormMessage tone="success" message={notice} />{/if}

<div role="tablist" aria-label="Jenis kategori" class="flex gap-1 rounded-control border border-forest-600 bg-forest-900 p-1 sm:w-fit">
	{#each TABS as tab (tab)}
		<button
			type="button"
			role="tab"
			aria-selected={activeType === tab}
			aria-controls="kategori-panel"
			onclick={() => (activeType = tab)}
			class="h-10 flex-1 rounded-[8px] px-4 text-sm font-medium sm:flex-none
				{activeType === tab ? 'bg-forest-700 text-beige-100' : 'text-sage-300 hover:bg-forest-800'}"
		>
			{CATEGORY_TYPE_LABELS[tab]}
		</button>
	{/each}
</div>

{#snippet categoryRow(category: Category, isChild: boolean)}
	<div class="flex min-h-14 items-center gap-2 py-2 {isChild ? 'pl-6' : ''}">
		{#if isChild}<CornerDownRight class="size-4 shrink-0 text-slate-500" aria-hidden="true" />{/if}
		<p class="min-w-0 flex-1 truncate {category.isArchived ? 'text-sage-400' : 'text-beige-100'}">
			{category.name}
			{#if category.isArchived}
				<span class="ml-2 rounded-full border border-forest-600 px-2 py-0.5 text-[11px] text-sage-400">Diarsipkan</span>
			{/if}
		</p>
		{#if !isChild && !category.isArchived}
			<button
				type="button"
				onclick={() => openCreate(category.id)}
				aria-label="Tambah subkategori di {category.name}"
				title="Tambah subkategori"
				class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
			>
				<Plus class="size-4" aria-hidden="true" />
			</button>
		{/if}
		<button
			type="button"
			onclick={() => openEdit(category)}
			aria-label="Ubah {category.name}"
			class="flex size-11 items-center justify-center rounded-control text-sage-300 hover:bg-forest-800"
		>
			<Pencil class="size-4" aria-hidden="true" />
		</button>
	</div>
{/snippet}

<div id="kategori-panel" role="tabpanel" tabindex="0" aria-label={CATEGORY_TYPE_LABELS[activeType]} class="rounded-card border border-forest-600 bg-forest-900 px-5 py-2">
	{#if tree.length === 0}
		<EmptyState title="Belum ada kategori" description="Tambahkan kategori untuk mengelompokkan transaksi." />
	{:else}
		<ul class="divide-y divide-forest-600">
			{#each tree as node (node.category.id)}
				<li>
					{@render categoryRow(node.category, false)}
					{#if node.children.length > 0}
						<ul>
							{#each node.children as child (child.id)}
								<li>{@render categoryRow(child, true)}</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<Dialog bind:open={formOpen} title={formTitle}>
	<CategoryForm
		category={editing}
		type={editing?.type ?? activeType}
		parentId={presetParentId}
		parentOptions={data.categories}
		onDone={() => finish(editing ? 'Kategori disimpan.' : 'Kategori ditambahkan.')}
	/>

	{#if editing}
		{@const target = editing}
		<div class="flex flex-col gap-3 border-t border-forest-600 pt-4">
			{#if actionError}<FormMessage message={actionError} />{/if}
			<div class="flex flex-col gap-3 sm:flex-row">
				<form
					method="POST"
					action="?/archive"
					class="flex-1"
					use:enhance={enhanceWithFeedback({
						onSuccess: (message) => finish(message ?? ''),
						onFailure: (message) => (actionError = message)
					})}
				>
					<input type="hidden" name="id" value={target.id} />
					<input type="hidden" name="archived" value={String(!target.isArchived)} />
					<button
						type="submit"
						class="flex h-11 w-full items-center justify-center gap-2 rounded-control border border-forest-600 text-sm font-medium hover:bg-forest-800"
					>
						{#if target.isArchived}
							<ArchiveRestore class="size-4" aria-hidden="true" /> Pulihkan
						{:else}
							<Archive class="size-4" aria-hidden="true" /> Arsipkan
						{/if}
					</button>
				</form>
				<button
					type="button"
					onclick={() => {
						formOpen = false;
						deleteOpen = true;
					}}
					class="flex h-11 flex-1 items-center justify-center gap-2 rounded-control border border-coral-400 text-sm font-medium text-coral-400 hover:bg-forest-800"
				>
					<Trash2 class="size-4" aria-hidden="true" /> Hapus
				</button>
			</div>
		</div>
	{/if}
</Dialog>

{#if editing}
	<ConfirmDialog
		bind:open={deleteOpen}
		title="Hapus kategori {editing.name}?"
		description="Kategori yang punya subkategori atau transaksi tidak bisa dihapus; arsipkan saja."
		action="?/delete"
		fields={{ id: editing.id }}
		onConfirmed={() => (notice = 'Kategori dihapus.')}
	/>
{/if}

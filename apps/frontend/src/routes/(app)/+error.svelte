<script lang="ts">
	import { page } from '$app/state';
	import ErrorState from '#lib/components/ui/ErrorState.svelte';
</script>

<ErrorState status={page.status} />

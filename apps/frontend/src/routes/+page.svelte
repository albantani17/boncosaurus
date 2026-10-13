<script lang="ts">
	let { data } = $props();
</script>

<h1>Boncosaurus</h1>
<p>API: {data.api ? data.api.status : 'unreachable'}</p>

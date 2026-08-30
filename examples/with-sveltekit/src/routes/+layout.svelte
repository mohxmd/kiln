<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>SvelteKit + Kiln</title>
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
</svelte:head>
{@render children()}

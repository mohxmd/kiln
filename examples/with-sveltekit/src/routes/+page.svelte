<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props<{
		data: {
			message: string;
			framework: string;
		};
	}>();
</script>

<h1>{data.message}</h1>
<p>Framework: {data.framework}</p>
<p><a href={resolve('/api/health')}>Health endpoint</a></p>
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<p><a href={resolve('/') + 'kiln.txt'}>Static asset</a></p>

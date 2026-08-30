<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props<{
		data: {
			message: string;
			framework: string;
		};
	}>();
</script>

<svelte:head>
	<meta
		name="description"
		content="SvelteKit compiled into a standalone native executable with Kiln."
	/>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 font-sans text-zinc-100 antialiased"
>
	<main class="flex w-full max-w-2xl flex-col items-center text-center">
		<div class="mb-8 flex items-center justify-center">
			<img
				src="/kiln-logo.png"
				alt="Kiln Logo"
				class="h-24 w-24 drop-shadow-[0_0_24px_rgba(249,115,22,0.3)]"
			/>
		</div>

		<div
			class="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-orange-400 uppercase"
		>
			<span class="h-2 w-2 animate-pulse rounded-full bg-orange-400"></span>
			Compiled Native Binary
		</div>

		<h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">
			{data.framework} + Kiln
		</h1>

		<p class="mt-4 max-w-lg text-base text-zinc-400 sm:text-lg">
			{data.message}. This fullstack application is running from a single native standalone
			executable binary.
		</p>

		<div class="mt-8 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
			<div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
				<h3 class="font-semibold text-white">⚡ SvelteKit SSR + Bun</h3>
				<p class="mt-1.5 text-sm text-zinc-400">
					Request-time server rendering and API routes preserved inside the compiled runtime.
				</p>
			</div>

			<div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
				<h3 class="font-semibold text-white">📦 Zero Host Setup</h3>
				<p class="mt-1.5 text-sm text-zinc-400">
					Run the standalone binary without installing Node.js, Bun, or node_modules.
				</p>
			</div>
		</div>

		<div class="mt-8 flex flex-wrap items-center justify-center gap-4">
			<a
				href="https://github.com/mohxmd/kiln"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
			>
				Kiln GitHub
			</a>
			<a
				href="https://svelte.dev/docs/kit"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
			>
				SvelteKit Docs
			</a>
			<a
				href={resolve('/api/health')}
				class="rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
			>
				Health API
			</a>
		</div>
	</main>
</div>

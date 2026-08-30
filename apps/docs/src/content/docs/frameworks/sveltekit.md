---
title: SvelteKit Adapter
description: Compile SvelteKit applications using adapter-node into native Bun executables.
---

The **SvelteKit adapter** packages the default `@sveltejs/adapter-node` build
output into a standalone Kiln executable.

## Requirements

- SvelteKit
- `@sveltejs/adapter-node`
- The default SvelteKit output directory: `build`

The adapter is experimental. Plain Svelte + Vite applications are not
detected by this adapter because Svelte is the component compiler, while
SvelteKit provides the application server, routing, and deployment output.

## Configure SvelteKit

Use `@sveltejs/adapter-node` in the SvelteKit adapter configuration. Depending
on the Svelte CLI template version, this is configured in `svelte.config.js`
or in the `sveltekit(...)` plugin inside `vite.config.ts`.

```js
import adapter from "@sveltejs/adapter-node";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

For a current `sv create` project, replace `@sveltejs/adapter-auto` with
`@sveltejs/adapter-node` in `vite.config.ts` and keep `adapter: adapter()`.

## Build and compile

```bash
bun run build
kiln -f sveltekit -o ./bin/app
PORT=3000 ./bin/app
```

Kiln launches the official SvelteKit production server from `build/index.js`.
The `bun-serve` runtime engine and custom SvelteKit output directories are not
supported by this initial adapter. External production dependencies retained by
SvelteKit still require a real application fixture before this integration can
be considered production-ready.

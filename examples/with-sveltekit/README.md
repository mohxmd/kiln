# SvelteKit + Kiln

Minimal SvelteKit application used to verify Kiln's experimental SvelteKit
adapter with `@sveltejs/adapter-node`.

## Development

```bash
bun install
bun run dev
```

## Build and compile

```bash
bun run check
bun run build
bun run compile
PORT=3000 ./bin/app
```

The example includes an SSR page, a JSON server route, and a static asset so
the compiled binary can be compared with the normal SvelteKit server.

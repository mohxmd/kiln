# kiln 🔥

Compile framework apps into a single native executable via [Bun](https://bun.sh).

> **Supported**: Next.js · **Planned**: React Router, SvelteKit, TanStack Start, Deno runtime

## Install

```bash
npm install kiln
# or
bun add kiln
```

## Quick Start (Next.js)

### 1. Configure the build adapter

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    adapterPath: import.meta.resolve("kiln"),
  },
};

export default nextConfig;
```

### 2. Build & compile

```bash
next build && kiln
```

### 3. Run the binary

```bash
./server          # single file, no node_modules needed
```

## CLI

```bash
kiln [options] [-- bun-build-flags...]
```

| Flag | Default | Description |
|---|---|---|
| `--project, -p` | `.` | Project root directory |
| `--out, -o` | `./server` | Output binary path |
| `--framework, -f` | _(auto-detect)_ | Framework adapter to use |
| `--list-adapters` | | Show registered adapters |

### Cross-compilation

```bash
kiln -o ./server-linux   --target bun-linux-x64
kiln -o ./server-arm     --target bun-linux-arm64
kiln -o ./server-win.exe --target bun-windows-x64
```

## transpilePackages (Next.js)

The Next.js adapter automatically detects packages that need to be transpiled (e.g., UI libraries in a monorepo). It looks for them in this order:

1. Standard Next.js `transpilePackages` in `next.config.js` [(see docs)](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
2. Custom `nextConfig.nextRuntimeCompiler.transpilePackages`
3. Environment variable `NEXT_RUNTIME_COMPILER_TRANSPILE_PACKAGES` (comma-separated)

Example `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui-components', '@repo/design-system'],
}

module.exports = nextConfig
```

## CDN / assetPrefix

When `assetPrefix` is set, static assets (`/_next/static/*`) are assumed CDN-hosted and **not** embedded. `public/*` is always embedded.

## Adding a New Framework Adapter

Implement the `FrameworkAdapter` interface and register it:

```ts
import type { FrameworkAdapter } from "kiln";
import { registerAdapter } from "kiln";

const myAdapter: FrameworkAdapter = {
  framework: "my-framework",
  name: "My Framework",
  detect: (dir) => existsSync(join(dir, "my-framework.config.ts")),
  getStandaloneDir: (dir) => join(dir, "build/server"),
  getDistDir: (dir) => join(dir, "build"),
  getStaticAssetConfig: () => ({ dir: "client", urlPrefix: "/assets" }),
  getStubs: () => [],
  getBuildDefines: () => [],
  generateServerEntry: (ctx) => `/* runtime entry code */`,
};

registerAdapter({ framework: "my-framework", create: () => myAdapter });
```

## Programmatic API

```ts
import { compileApp, compileStandalone, generateEntryPoint } from "kiln";
```

| Function | Description |
|---|---|
| `compileApp(opts)` | End-to-end: detect framework → generate → compile |
| `generateEntryPoint(opts)` | Generate asset map + server entry using adapter |
| `compileStandalone(opts)` | Run `bun build --compile` only |

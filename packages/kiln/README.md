# kiln 🔥

Compile modern framework apps into a single native executable via [Bun](https://bun.sh).

> **Supported**: Next.js (App Router & Pages Router) · **Planned**: React Router / Remix, SvelteKit, TanStack Start, Astro, Nitro

---

## Features

- 🚀 **100% Self-Contained Binary**: Employs single-file native executables with all static assets, SSR chunks, and server runtimes embedded.
- ⚡ **Instant Cold Starts**: Fast-path SHA-256 build manifest check (`.kiln-extracted`) skips extraction on subsequent boots.
- 🐳 **Docker Optimized**: Pre-extract assets during `docker build` using `./server --extract` for sub-10ms container cold starts.
- 🗜️ **Optimized Binary Footprint**: Prunes dead build artifacts (sourcemaps, dev builds, webpack internals) and Gzip-compresses embedded runtime files.
- 🧩 **Turbopack & Monorepo Ready**: In-place Turbopack alias resolution and runtime `Module._resolveFilename` fallback hook.
- 🌐 **Universal Architecture**: Plugin-based `FrameworkAdapter` contract to compile any web framework.

---

## Install

```bash
npm install -D kiln-compiler
# or
bun add -d kiln-compiler
```

---

## Quick Start (Next.js)

### 1. Configure the build adapter in `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    adapterPath: import.meta.resolve("kiln-compiler"),
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
./server          # single standalone file, no node_modules needed
```

---

## CLI Options

```bash
kiln [options] [-- bun-build-flags...]
```

| Flag | Default | Description |
|---|---|---|
| `--project, -p` | `.` | Project root directory |
| `--out, -o` | `./server` | Output binary path |
| `--framework, -f` | _(auto-detect)_ | Framework adapter to use |
| `--target, -t` | _(host platform)_ | Cross-compile target (e.g. `bun-linux-x64`, `bun-windows-x64`) |
| `--list-adapters` | | Show registered framework adapters |
| `--help, -h` | | Show help menu |

### Cross-compilation

```bash
kiln -o ./server-linux   --target bun-linux-x64
kiln -o ./server-arm     --target bun-linux-arm64
kiln -o ./server-win.exe --target bun-windows-x64
```

---

## Environment Variables (Runtime)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server HTTP port |
| `HOSTNAME` | `0.0.0.0` | Server hostname |
| `KEEP_ALIVE_TIMEOUT` | — | HTTP keep-alive timeout in milliseconds |
| `KILN_RUNTIME_DIR` | Binary directory | Runtime files extraction root (e.g. `/tmp/app` for RAM-backed tmpfs) |

---

## Docker Layer Caching (`--extract`)

To achieve instant sub-10ms container cold starts, pre-materialize runtime files during image build:

```dockerfile
FROM oven/bun:alpine AS runner
WORKDIR /app
COPY server /app/server
RUN ["/app/server", "--extract"]

EXPOSE 3000
CMD ["/app/server"]
```

---

## Adding a New Framework Adapter

Implement the `FrameworkAdapter` interface and register it:

```ts
import type { FrameworkAdapter } from "kiln-compiler";
import { registerAdapter } from "kiln-compiler";

const myAdapter: FrameworkAdapter = {
  framework: "my-framework",
  name: "My Framework",
  detect: (dir) => existsSync(join(dir, "my-framework.config.ts")),
  getStandaloneDir: (dir) => join(dir, "build/server"),
  getDistDir: (dir) => join(dir, "build"),
  getStaticAssetConfig: () => ({ dir: "client", urlPrefix: "/assets" }),
  getRuntimeFiles: (ctx) => [/* server files to embed */],
  getStubs: () => [],
  getBuildDefines: () => [],
  generateServerEntry: (ctx) => `/* runtime entry code */`,
};

registerAdapter({ framework: "my-framework", create: () => myAdapter });
```

---

## Programmatic API

```ts
import { compileApp, compileStandalone, generateEntryPoint } from "kiln-compiler";
```

| Function | Description |
|---|---|
| `compileApp(opts)` | End-to-end: detect framework → generate → compile |
| `generateEntryPoint(opts)` | Generate asset map + server entry using adapter |
| `compileStandalone(opts)` | Run `bun build --compile` only |

---

## Acknowledgements

The Next.js runtime compilation patterns and Turbopack compatibility techniques in this project were inspired by and derived from [next-bun-compile](https://github.com/ramonmalcolm10/next-bun-compile).

---
title: TanStack Start Adapter
description: Compiling TanStack Start & Nitro fullstack React applications into native Bun executables.
---

The **TanStack Start Adapter** in Kiln compiles fullstack React applications built with [TanStack Start](https://tanstack.com/start) into standalone native executable binaries.

---

## Supported Features

- **TanStack Start & Nitro standalone output** (`.output/`)
- **Full Server-Side Rendering (SSR) & Streaming**
- **Server Functions & RPC Data Loading**
- **Dual Runtime Engines**: `default` (standard Nitro) and `bun-serve` (100k+ req/sec zero-copy static asset accelerator).

---

## Configuration

In your `package.json`:

```json
"scripts": {
  "build": "tanstack-start build",
  "compile": "kiln -o ./bin/app",
  "build:compile": "tanstack-start build && kiln -o ./bin/app"
}
```

---

## Build & Run

Run build and compile in one command:

```bash
bun run build:compile
./bin/app
```

The application will start on `http://0.0.0.0:3000` (or `PORT` / `NITRO_PORT` environment variable).

---

## High-Speed `bun-serve` Engine

To accelerate static asset delivery in `.output/public/` using Bun's native Zig static dispatcher:

```bash
kiln --engine bun-serve -o ./bin/app
```

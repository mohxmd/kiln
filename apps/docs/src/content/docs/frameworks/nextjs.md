---
title: Next.js Adapter
description: Compiling Next.js 15+ and 16 applications into standalone native executables.
---

The **Next.js Adapter** in Kiln provides production-grade single-binary compilation for both **App Router** and **Pages Router** applications.

---

## Supported Versions

- **Next.js 16.x** (with top-level `adapterPath`)
- **Next.js 15.x** (with `experimental.adapterPath`)
- **Turbopack builds**
- **React 19 & Server Actions**

---

## Configuration

In your `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  adapterPath: import.meta.resolve("kiln-compiler"),
};

export default nextConfig;
```

---

## Build Commands

Add the following scripts to your `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "compile": "kiln -o ./bin/app",
  "build:compile": "next build && kiln -o ./bin/app"
}
```

Run:

```bash
bun run build:compile
./bin/app
```

---

## Monorepo & pnpm Support

In monorepo workspaces (pnpm, Bun workspaces, npm workspaces), Next.js outputs standalone builds into nested subdirectories (e.g. `.next/standalone/apps/web/`).

Kiln automatically:

1. Detects `relativeAppDir` from `required-server-files.json`.
2. Unnests the standalone output structure so the binary executes cleanly in any target folder.
3. Resolves packages across standard `node_modules`, `.pnpm/`, and `.bun/` virtual stores.

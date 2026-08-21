---
title: Creating Framework Adapters
description: How to build and register new framework adapters in Kiln.
---

Kiln's core compiler is framework-agnostic. All framework-specific build output conventions are encapsulated in `FrameworkAdapter` implementations.

---

## The `FrameworkAdapter` Interface

```ts
import type { FrameworkAdapter } from "kiln-compiler";

export interface FrameworkAdapter {
  readonly framework: string;
  readonly name: string;

  detect(projectDir: string): boolean;
  getStandaloneDir(projectDir: string): string;
  getDistDir(projectDir: string): string;
  getStaticAssetConfig(): { dir: string; urlPrefix: string };
  getStubs(): readonly StubModule[];
  getBuildDefines(): readonly string[];
  generateServerEntry(ctx: ServerEntryContext): string;
}
```

---

## Step-by-Step Guide

1. **Create Adapter File**: In `packages/kiln/src/adapter/<framework>/index.ts`.
2. **Implement Detection**: Check for config files (`astro.config.mjs`, `vite.config.ts`, etc.).
3. **Configure Asset Paths**: Map static assets (`client/`) and runtime chunks (`server/`).
4. **Generate Server Entry**: Return the runtime JavaScript source that starts your framework's server.
5. **Register Adapter**: In `packages/kiln/src/adapter/registry.ts`:
   ```ts
   registerAdapter({
     framework: "my-framework",
     create: () => createMyAdapter(),
   });
   ```

---
title: Astro Adapter
description: Compiling Astro 5+ and 7+ applications into native Bun executables.
---

The **Astro Adapter** in Kiln turns Astro SSR applications into standalone binaries with native asset extraction and fast server startup.

---

## Supported Versions

- **Astro 5.x & Astro 7.x**
- **`@astrojs/node` standalone output**
- **SSR, Hybrid, and Static Prerendered Routes**

---

## Configuration

Install `@astrojs/node`:

```bash
bun add @astrojs/node
bun add -d kiln-compiler
```

In your `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});
```

---

## Build & Run

In your `package.json`:

```json
"scripts": {
  "build": "astro build",
  "compile": "kiln -o ./bin/app",
  "build:compile": "astro build && kiln -o ./bin/app"
}
```

Compile and run:

```bash
bun run build:compile
./bin/app
```

The application will start listening on `http://0.0.0.0:4321` (or `PORT` environment variable).

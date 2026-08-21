---
title: Quick Start
description: Get up and running with Kiln in 2 minutes.
---

Follow this guide to compile your first web application into a native executable binary.

---

## 1. Install Kiln

Add `kiln-compiler` as a development dependency in your project:

```bash
# Using Bun
bun add -d kiln-compiler

# Using pnpm
pnpm add -D kiln-compiler

# Using npm
npm install -D kiln-compiler
```

---

## 2. Configure Your Framework

### For Next.js (15+ & 16)

In your `next.config.ts` (or `next.config.js`):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  adapterPath: import.meta.resolve("kiln-compiler"),
};

export default nextConfig;
```

### For Astro (5+ & 7+)

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

## 3. Build & Compile

Run your framework's build followed by `kiln`:

```bash
# For Next.js:
next build && kiln -o ./bin/app

# For Astro:
astro build && kiln -o ./bin/app
```

---

## 4. Run the Binary

Execute the standalone binary directly:

```bash
# On Linux / macOS:
./bin/app

# On Windows:
.\bin\app.exe
```

Open `http://localhost:3000` (or `http://localhost:4321` for Astro) to see your app live!

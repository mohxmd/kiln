<p align="center">
  <img src="assets/logo.png" width="128" height="128" alt="Kiln Logo" />
</p>

# kiln

[![npm version](https://img.shields.io/npm/v/kiln-compiler.svg?style=flat-square&color=CB3837)](https://www.npmjs.com/package/kiln-compiler)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.0-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

**Kiln** is a universal framework compiler that turns modern web applications into single, self-contained native executable binaries via [Bun](https://bun.sh).

No `node_modules` or Node.js runtime installation required on the target server.

---

## Framework Support Matrix

| Framework                        | Status               | Adapter / Engine              |
| -------------------------------- | -------------------- | ----------------------------- |
| **Next.js (App & Pages Router)** | Supported (15+ & 16) | Native `adapterPath` hook     |
| **Astro**                        | Supported (5+ & 7+)  | `@astrojs/node` standalone    |
| **TanStack Start**               | Supported            | Nitro / `.output` standalone  |
| **React Router v7 / Remix**      | Supported            | Vite SSR / `build` standalone |
| **SvelteKit**                    | Planned              | Adapter in roadmap            |
| **Nitro**                        | Planned              | Adapter in roadmap            |

---

## Quick Usage

Install in your framework app:

```bash
bun add -d kiln-compiler
# or
npm install -D kiln-compiler
```

Configure `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  adapterPath: import.meta.resolve("kiln-compiler"),
};

export default nextConfig;
```

Build and compile into a native binary:

```bash
next build && kiln -o ./bin/app
./bin/app
```

> For full documentation, CLI options, cross-compilation, and Docker optimization, see the **[`packages/kiln` README](packages/kiln)** or our **[Documentation Site](https://github.com/mohxmd/kiln)**.

# kiln

[![npm version](https://img.shields.io/npm/v/kiln-compiler.svg?style=flat-square&color=CB3837)](https://www.npmjs.com/package/kiln-compiler)
[![license](https://img.shields.io/npm/l/kiln-compiler.svg?style=flat-square&color=blue)](https://github.com/mohxmd/kiln/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.0-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

**Kiln** is a universal framework compiler that turns modern web applications into single, self-contained native executable binaries via [Bun](https://bun.sh).

No `node_modules` or Node.js runtime installation required on the target server.

---

## Framework Support Matrix

| Framework | Status | Adapter / Engine |
|---|---|---|
| **Next.js (App & Pages Router)** | Supported (15+ & 16) | Native `adapterPath` hook |
| **SvelteKit** | Planned | Adapter in roadmap |
| **React Router v7 / Remix** | Supported | Vite SSR / `build` standalone |
| **TanStack Start** | Supported | Nitro / `.output` standalone |
| **Astro** | Supported (5+) | `@astrojs/node` standalone |
| **Nitro** | Planned | Adapter in roadmap |

---

## Packages in this Repository

| Directory | Package | Description |
|---|---|---|
| [`packages/kiln`](packages/kiln) | [`kiln-compiler`](https://www.npmjs.com/package/kiln-compiler) | Core compiler CLI, framework adapters & standalone generator |
| [`examples/with-nextjs`](examples/with-nextjs) | `with-nextjs` | Next.js 16 App Router live demo & integration test |

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

> For full documentation, CLI options, cross-compilation, and Docker optimization, see the **[`packages/kiln` README](packages/kiln)**.

---

## Monorepo Development

```bash
# 1. Clone the repository
git clone https://github.com/mohxmd/kiln.git
cd kiln

# 2. Install dependencies across workspace
bun install

# 3. Run unit test suite (via Bun)
bun test

# 4. Build the core package
bun run build

# 5. Test the live Next.js example
cd examples/with-nextjs
bun run build:compile
./bin/app
```

---

## License

[MIT](LICENSE) Â© [Mohamed](https://github.com/mohxmd)
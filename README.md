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
| **Next.js (App & Pages Router)** | Supported (15+ & 16) | Built-in `experimental.adapterPath` hook |
| **SvelteKit** | Planned | Adapter in roadmap |
| **React Router / Remix** | Planned | Adapter in roadmap |
| **TanStack Start** | Planned | Adapter in roadmap |
| **Astro** | Planned | Adapter in roadmap |
| **Nitro** | Planned | Adapter in roadmap |

---

## Packages in this Repository

| Directory | Package | Description |
|---|---|---|
| [`packages/kiln`](packages/kiln) | [`kiln-compiler`](https://www.npmjs.com/package/kiln-compiler) | Core compiler CLI, framework adapters & standalone generator |
| [`examples/with-nextjs`](examples/with-nextjs) | — | Next.js 16 App Router live demo & integration test |

---

## Quick Usage

Install in your framework app:

```bash
pnpm add -D kiln-compiler
```

Configure `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    adapterPath: import.meta.resolve("kiln-compiler"),
  },
};

export default nextConfig;
```

Build and compile into a native binary:

```bash
next build && kiln
./server
```

> For full documentation, CLI options, cross-compilation, and Docker optimization, see the **[`packages/kiln` README](packages/kiln)**.

---

## Monorepo Development

```bash
# 1. Clone the repository
git clone https://github.com/mohxmd/kiln.git
cd kiln

# 2. Install dependencies across workspace
pnpm install

# 3. Run unit test suite (via Bun)
pnpm test

# 4. Build the core package
pnpm build

# 5. Test the live Next.js example
cd examples/with-nextjs
pnpm run build:compile
./server
```

---

## License

[MIT](LICENSE) © [Mohamed](https://github.com/mohxmd)

---

## Acknowledgements

The Next.js runtime compilation patterns and Turbopack compatibility techniques in this project were inspired by and derived from [next-bun-compile](https://github.com/ramonmalcolm10/next-bun-compile).
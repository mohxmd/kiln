<p align="center">
  <img src="assets/logo.png" width="128" height="128" alt="Kiln Logo" />
</p>

# kiln

[![npm version](https://img.shields.io/npm/v/kiln-compiler.svg?style=flat-square&color=CB3837)](https://www.npmjs.com/package/kiln-compiler)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.0-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

**Kiln** is an open-source compiler for packaging modern web applications as
self-contained native executables. The current stable compiler backend is
[Bun](https://bun.sh), and the compiler boundary is designed to support
additional backends without changing framework adapters.

The resulting server does not need `node_modules`, Node.js, or Bun installed.

---

## Framework Support Matrix

| Framework                        | Status               | Adapter / Engine              |
| -------------------------------- | -------------------- | ----------------------------- |
| **Next.js (App & Pages Router)** | Supported (15+ & 16) | Native `adapterPath` hook     |
| **Astro**                        | Supported (5+ & 7+)  | `@astrojs/node` standalone    |
| **TanStack Start**               | Supported            | Nitro / `.output` standalone  |
| **React Router v7 / Remix**      | Supported            | Vite SSR / `build` standalone |
| **SvelteKit**                    | Experimental         | `@sveltejs/adapter-node`      |
| **Nitro**                        | Planned              | Adapter in roadmap            |

---

## Quick Start

Install Kiln as a development dependency in your framework application:

```bash
bun add -d kiln-compiler
# or
npm install -D kiln-compiler
```

For example, configure a Next.js application in `next.config.ts`:

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

See the [package README](packages/kiln/README.md) for CLI and API details, or
the [documentation source](apps/docs) for the full guides.

## Documentation

- [Getting started](apps/docs/src/content/docs/getting-started/introduction.md)
- [CLI reference](apps/docs/src/content/docs/reference/cli.md)
- [Framework guides](apps/docs/src/content/docs/frameworks)
- [Package API and deployment notes](packages/kiln/README.md)

## Repository Layout

```text
apps/docs/       Documentation site
packages/kiln/   Published compiler package
examples/        Framework integration examples
assets/          Repository assets
```

## Development

Kiln uses Bun workspaces. Install the pinned toolchain and dependencies from the repository root:

```bash
bun install --frozen-lockfile
```

Common checks:

```bash
bun run check-types
bun run test
bun run build
bun run docs:build
```

The compiler is organized around framework adapters, a portable runtime and
asset model, and replaceable compiler backends. Bun is stable; future backends
remain experimental until they pass the same fixture and executable tests.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security reports should follow [SECURITY.md](SECURITY.md), and release maintainers should follow [RELEASING.md](RELEASING.md).

## License

Kiln is released under the [MIT License](LICENSE).

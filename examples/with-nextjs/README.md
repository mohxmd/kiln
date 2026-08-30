# with-nextjs

This is a Next.js 16 (App Router & React 19) demonstration application compiled into a single native binary using **[Kiln](https://github.com/mohxmd/kiln)**.

---

## Quick Start

### 1. Install dependencies

```bash
bun install
```

### 2. Run local development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the development app.

---

## Compiling to a Single Native Binary

### 1. Build and compile in one step

```bash
bun run build:compile
```

This runs `next build` followed by `kiln -o ./bin/app` to produce a standalone executable binary in `./bin/`.

### 2. Run the compiled executable

```bash
# On Linux / macOS:
./bin/app

# On Windows:
.\bin\app.exe
```

The application will start on [http://localhost:3000](http://localhost:3000) with **zero dependencies or node_modules needed**.

---

## Configuration

In `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  adapterPath: import.meta.resolve("kiln-compiler"),
};

export default nextConfig;
```
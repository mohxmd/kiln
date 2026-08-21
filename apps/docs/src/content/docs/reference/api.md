---
title: Programmatic API
description: Using Kiln programmatically in Node.js and Bun scripts.
---

Import Kiln compiler functions directly into TypeScript or JavaScript build scripts:

```ts
import {
  compileApp,
  compileStandalone,
  generateEntryPoint,
} from "kiln-compiler";
```

---

## `compileApp(options)`

Executes the full end-to-end compilation workflow:

```ts
const result = compileApp({
  projectDir: "./apps/web",
  outputFile: "./bin/app",
  framework: "next", // optional (auto-detected if omitted)
});

console.log(result.outputFile); // Path to generated executable
console.log(result.framework); // Detected framework
```

---

## `generateEntryPoint(options)`

Generates the asset manifest and server entrypoint without running Bun compile:

```ts
import { generateEntryPoint, getAdapter } from "kiln-compiler";

const adapter = getAdapter("next")!;
generateEntryPoint({
  standaloneDir: "./.next/standalone",
  distDir: "./.next",
  projectDir: process.cwd(),
  adapter,
});
```

---

## `compileStandalone(options)`

Compiles the generated entrypoint using `bun build --compile`:

```ts
import { compileStandalone } from "kiln-compiler";

compileStandalone({
  standaloneDir: "./.next/standalone",
  outfile: "./bin/app",
});
```

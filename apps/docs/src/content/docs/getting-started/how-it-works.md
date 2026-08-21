---
title: How It Works
description: Deep dive into the internal compilation and runtime lifecycle of Kiln.
---

Kiln operates in two phases: **Build-Time Compilation** and **Runtime Initialization**.

---

## Phase 1: Build-Time Compilation

When you run `kiln`:

```
Framework Build (next build / astro build)
                │
                ▼
1. Framework Auto-Detection
   • Discovers adapter (Next.js, Astro, etc.)
                │
                ▼
2. Asset Mapping & Dead-Code Pruning
   • Traverses standalone output & static assets
   • Prunes dead build artifacts (sourcemaps, dev bundles, Webpack machinery)
   • Compresses text server chunks >= 8KB with Level-1 Gzip
                │
                ▼
3. Standalone Entrypoint Generation
   • Generates assets.generated.js with embedded file imports
   • Generates server-entry.js with dynamic runtime loader hooks
                │
                ▼
4. Native Bun Compilation
   • Executes `bun build --compile --production --minify`
   • Emits single executable binary
```

---

## Phase 2: Runtime Lifecycle

When the compiled binary is executed on a server:

1. **Cold Start (First Boot)**:
   - Checks `.kiln-extracted` for a valid SHA-256 build stamp.
   - If not found or changed, unpacks embedded runtime assets into `baseDir` (or `KILN_RUNTIME_DIR`).
   - Writes the new build stamp.
2. **Warm Start (Subsequent Boots)**:
   - Reads the build stamp and matches the embedded hash.
   - **Skips disk extraction completely** and starts the HTTP server in **0ms**.
3. **HTTP Server Execution**:
   - Delegates request handling to the framework's native production engine (`startServer` for Next.js, `entry.mjs` for Astro).

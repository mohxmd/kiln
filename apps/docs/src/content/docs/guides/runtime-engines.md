---
title: Runtime Engines
description: Understanding the Default Engine vs High-Speed Bun.serve Static Dispatch Engine.
---

Kiln supports two runtime server engines for serving your compiled application:

1. **`default` Engine** _(Default)_: Uses the framework's official production HTTP server.
2. **`bun-serve` Engine**: Uses Bun's native Zig-powered HTTP dispatcher for zero-copy static asset delivery at 100,000+ req/sec.

---

## Comparison Matrix

| Feature                             | `default` Engine                      | `bun-serve` Engine                       |
| ----------------------------------- | ------------------------------------- | ---------------------------------------- |
| **Static Asset Performance**        | Standard framework speed (~15k req/s) | **Native Zig speed (~100k+ req/s)**      |
| **Time to First Byte (TTFB)**       | ~5-15ms                               | **<1ms (Instant)**                       |
| **Zero-Copy Static File Transfers** | ❌ (Node.js buffers)                  | ✅ (`Bun.file` kernel sendfile)          |
| **Dynamic SSR & Server Actions**    | ✅ Native                             | ✅ Native (proxied in-process)           |
| **Next.js 16 `proxy.ts`**           | ✅ Intercepts all traffic             | ✅ Intercepts dynamic & API traffic      |
| **Best For**                        | 100% standard framework compatibility | **High-traffic public web applications** |

---

## How to Select an Engine

### Via CLI Option:

```bash
# Standard default engine
kiln --engine default -o ./bin/app

# High-speed Bun.serve engine
kiln --engine bun-serve -o ./bin/app
```

### Via Environment Variable:

```bash
KILN_ENGINE=bun-serve kiln -o ./bin/app
```

---

## How the `bun-serve` Engine Works

When compiled with `--engine bun-serve`:

```
┌──────────────────────────────────────────────────────────┐
│                   Incoming HTTP Request                  │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│             Bun.serve Native Zig Dispatcher              │
└──────────────┬────────────────────────────┬──────────────┘
               │                            │
  Matches Static Asset in         Dynamic Route, API,
  /_next/static/* or public/      Server Action, or proxy.ts
               │                            │
               ▼                            ▼
      ⚡ Instant Response            Proxied In-Process to
     (~100,000+ req/sec)              Framework Server
```

1. **Tier 1 (Static `/_next/static/*` assets)**: Served directly via `Bun.file` with `Cache-Control: public, max-age=31536000, immutable`.
2. **Tier 2 (Public static files)**: Served directly via `Bun.file` with zero JS heap allocation.
3. **Tier 3 (Dynamic SSR & APIs)**: Forwarded to the in-process framework server with full support for React 19 Server Actions and Next 16 `proxy.ts`.

---
title: Introduction
description: What is Kiln and why compile web apps into native executables?
---

**Kiln** is an open-source universal compiler that transforms modern fullstack web applications into single, standalone native executable binaries using [Bun](https://bun.sh).

---

## The Problem with Traditional Web Deployment

Deploying fullstack JavaScript and TypeScript applications to servers, virtual machines, or minimal containers traditionally requires:

1. **Large `node_modules` Directories**: Shipping thousands of small files to production creates slow I/O, heavy container layers, and permission complexities.
2. **Runtime Host Dependencies**: Target machines must have matching versions of Node.js or Bun installed and configured on the system PATH.
3. **Complex Cold Starts**: Starting dynamic servers from cold filesystems requires disk seeks across hundreds of dependencies before listening on ports.

---

## The Kiln Solution

Kiln packages your framework build output, static assets, and runtime dependencies into **one single binary executable** (e.g. `./server` or `.\server.exe`):

```
┌──────────────────────────────────────────────────────────┐
│                   Single Native Binary                    │
│                      (e.g. ./server)                     │
├──────────────────────────┬───────────────────────────────┤
│ • Embedded Static Assets │ (CSS, JS, Images, Fonts)      │
│ • Embedded Server Chunks │ (SSR routes, manifests)       │
│ • Embedded Runtime Deps  │ (node_modules, libraries)     │
│ • Standalone Runner      │ (Fast native runtime)         │
└──────────────────────────┴───────────────────────────────┘
```

---

## Key Benefits

- **Zero Host Dependencies**: Copy the single binary to any Linux, macOS, or Windows server and run it. No Node.js or `npm install` needed on the server.
- **Microsecond Cold Starts**: Fast-path SHA-256 build verification skips extraction on restarts, enabling near-instant boot times.
- **Cross-Compilation**: Build for Linux x64 or Linux ARM64 directly from your local machine using `--target`.
- **Universal Architecture**: Clean `FrameworkAdapter` design supporting **Next.js 16**, **Astro 7**, and future fullstack frameworks.

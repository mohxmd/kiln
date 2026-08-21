---
title: Environment Variables
description: Reference for build-time and runtime environment variables.
---

---

## Build-Time Variables

| Variable      | Description                           | Example                     |
| ------------- | ------------------------------------- | --------------------------- |
| `KILN_TARGET` | Target cross-compilation architecture | `KILN_TARGET=bun-linux-x64` |

---

## Runtime Variables

| Variable             | Default                        | Description                                    |
| -------------------- | ------------------------------ | ---------------------------------------------- |
| `PORT`               | `3000` (Next) / `4321` (Astro) | HTTP server port                               |
| `HOST` / `HOSTNAME`  | `0.0.0.0`                      | Bind IP address / host                         |
| `KEEP_ALIVE_TIMEOUT` | —                              | HTTP keep-alive timeout in milliseconds        |
| `KILN_RUNTIME_DIR`   | Directory containing binary    | Directory for unpacking embedded runtime files |

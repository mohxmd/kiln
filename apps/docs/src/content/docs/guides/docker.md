---
title: Docker Deployment
description: Deploying Kiln standalone binaries in minimal Docker containers.
---

Kiln binaries are 100% self-contained and run on minimal container bases like `oven/bun:alpine` or `debian:bookworm-slim` without copying `node_modules` or running `npm install`.

---

## Minimal Dockerfile Example

```dockerfile
# Multi-stage build
FROM oven/bun:alpine AS builder
WORKDIR /app

# Install dependencies and build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build:compile

# Production runner stage
FROM oven/bun:alpine AS runner
WORKDIR /app

# Copy ONLY the compiled binary
COPY --from=builder /app/bin/app /app/app

# Pre-extract runtime files during container build
RUN ["/app/app", "--extract"]

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["/app/app"]
```

---

## Why Pre-Extract with `--extract`?

When running in containerized environments (Kubernetes, AWS ECS, Fly.io, Railway), running:

```bash
RUN ["/app/app", "--extract"]
```

during `docker build` materializes the runtime files directly into the container's immutable image layer.

### Result:

- **Instant Container Startup**: When your container boots, extraction is already complete. It starts handling HTTP requests in **0ms**.
- **No Runtime Disk Overhead**: Saves memory and disk write operations inside ephemeral container environments.

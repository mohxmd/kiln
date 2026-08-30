---
title: React Router v7 Adapter
description: Compiling React Router v7 & Remix fullstack applications into native Bun executables.
---

The **React Router Adapter** in Kiln compiles fullstack React applications built with [React Router v7](https://reactrouter.com) (the unified successor to Remix) into single, self-contained native executable binaries.

---

## Supported Features

- **React Router v7 (and Remix) Vite SSR output** (`build/client` and `build/server`)
- **Server Loaders, Actions, and Streaming HTML**
- **Native `Bun.serve` static routing** (instant zero-copy file delivery from `build/client/`)
- **Web Standard `Request` / `Response` execution**

---

## Configuration

In your `package.json`:

```json
"scripts": {
  "build": "react-router build",
  "compile": "kiln -o ./bin/app",
  "build:compile": "react-router build && kiln -o ./bin/app"
}
```

---

## Build & Run

Run build and compile in one command:

```bash
bun run build:compile
./bin/app
```

The application will start on `http://0.0.0.0:3000` (or `PORT` environment variable).
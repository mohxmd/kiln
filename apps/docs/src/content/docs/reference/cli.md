---
title: CLI Reference
description: Complete reference for the kiln command-line interface.
---

```bash
kiln [options] [-- bun-build-flags...]
```

---

## Options

### `-p, --project <dir>`

- **Default**: `.`
- **Description**: Path to the project root directory containing the build output.
- **Example**: `kiln -p ./apps/web`

### `-o, --out <path>`

- **Default**: `./server` (or `.\server.exe` on Windows)
- **Description**: Path and filename for the compiled executable binary.
- **Example**: `kiln -o ./bin/app`

### `-f, --framework <name>`

- **Default**: _(auto-detected)_
- **Description**: Explicitly set framework adapter (e.g. `next`, `astro`).
- **Example**: `kiln -f next`

### `-b, --backend <name>`

- **Default**: `bun`
- **Description**: Select the compiler backend. Bun is stable; ScriptC is experimental and currently limited to native compiler probing while Kiln's generated runtime is being made portable.
- **Example**: `kiln --backend bun`

### `-e, --engine <engine>`

- **Default**: `default`
- **Description**: Select the runtime HTTP server: `default` for the framework server or `bun-serve` for the in-memory static accelerator.
- **Example**: `kiln --engine bun-serve`

### `-t, --target <target>`

- **Default**: _(host platform)_
- **Description**: Target cross-compilation platform.
- **Example**: `kiln -t bun-linux-x64`

The target is translated for the selected backend. Bun receives a `--target`
flag. ScriptC receives `SCRIPTC_TARGET` and requires `SCRIPTC_CC=zigcc` for
cross-compilation. Kiln currently rejects `wasm32-wasi` because its generated
HTTP runtime does not yet have a portable WASI host.

### `--list-adapters`

- **Description**: Lists all available registered framework adapters.

### `--list-backends`

- **Description**: Lists all available registered compiler backends.

### `-h, --help`

- **Description**: Displays CLI help and usage examples.

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

### `-t, --target <target>`

- **Default**: _(host platform)_
- **Description**: Target cross-compilation platform.
- **Example**: `kiln -t bun-linux-x64`

### `--list-adapters`

- **Description**: Lists all available registered framework adapters.

### `-h, --help`

- **Description**: Displays CLI help and usage examples.

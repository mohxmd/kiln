---
title: Cross-Compilation
description: Compile for Linux, macOS, and Windows from any development machine.
---

Kiln supports cross-compiling single executable binaries for different target architectures and operating systems using Bun's native cross-compiler.

---

## Supported Compilation Targets

| Target Flag                 | Architecture | Typical Use Case                                     |
| --------------------------- | ------------ | ---------------------------------------------------- |
| `--target bun-linux-x64`    | Linux x86_64 | Standard cloud servers, Docker, AWS, VPS             |
| `--target bun-linux-arm64`  | Linux ARM64  | AWS Graviton, Apple Silicon containers, Raspberry Pi |
| `--target bun-windows-x64`  | Windows x64  | Windows Server, Desktop Windows executables          |
| `--target bun-darwin-arm64` | macOS ARM64  | Apple Silicon macOS deployment                       |
| `--target bun-darwin-x64`   | macOS x64    | Intel macOS deployment                               |

---

## Example Usage

### Via CLI Flag:

```bash
# Compile for a Linux cloud server
kiln -o ./server-linux --target bun-linux-x64

# Compile for Windows
kiln -o ./server-win.exe --target bun-windows-x64
```

### Via Environment Variable:

You can also pass `KILN_TARGET`:

```bash
KILN_TARGET=bun-linux-x64 kiln -o ./bin/app
```

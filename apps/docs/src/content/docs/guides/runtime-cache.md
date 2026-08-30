---
title: Runtime Extraction & Cache
description: How Kiln manages file extraction and runtime cache directories.
---

When a Kiln binary executes, it unpacks embedded server files into an extraction directory.

---

## Default Behavior

By default, files are extracted to the directory containing the binary (`path.dirname(process.execPath)`).

```
/app/
├── app          # Executable binary
├── .kiln-extracted # Build stamp hash
├── .next/       # Extracted runtime chunks
└── node_modules/# Extracted dependencies
```

---

## Customizing Extraction Directory (`KILN_RUNTIME_DIR`)

If you prefer keeping your application directory clean and extracting files to a system temp folder or RAM-backed `tmpfs`:

### On Linux / Docker:

```bash
KILN_RUNTIME_DIR=/tmp/app-runtime ./bin/app
```

### On Windows PowerShell:

```powershell
$env:KILN_RUNTIME_DIR = "$env:TEMP\app-runtime"
.\bin\app.exe
```

---

## Instant Warm Restarts

Kiln writes a `.kiln-extracted` file containing the deterministic SHA-256 build hash. On subsequent runs:

1. It reads `.kiln-extracted`.
2. Matches the hash with the binary's embedded build stamp.
3. Skips extraction entirely and boots immediately.

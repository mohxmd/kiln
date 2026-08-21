#!/usr/bin/env node

/**
 * CLI entrypoint for compiling framework app output into a Bun binary.
 */

import { resolve } from "node:path";

import { listAdapters } from "./adapter/registry.js";
import { compileApp } from "./core/compile-app.js";
import { logError, logInfo } from "./utils/log.js";

function printHelp(): void {
  console.log(`
kiln ðŸ”¥ - Compile framework apps into single native Bun executables

Usage:
  kiln [options] [-- bun-build-flags...]

Options:
  -p, --project <dir>      Project root directory (default: ".")
  -o, --out <path>         Output binary path (default: "./server")
  -f, --framework <name>   Framework adapter to use (auto-detected if omitted)
  -t, --target <target>    Cross-compilation target (e.g. bun-linux-x64, bun-windows-x64)
  --list-adapters          List all registered framework adapters
  -h, --help               Show this help message

Examples:
  kiln
  kiln -o ./dist/app
  kiln -o ./server-linux --target bun-linux-x64
  kiln -p ./apps/web -f next
`);
}

function parseArgs(argv: string[]): {
  projectDir: string;
  outputFile?: string;
  framework?: string;
  extraArgs: string[];
} {
  let projectDir = ".";
  let outputFile: string | undefined;
  let framework: string | undefined;
  const extraArgs: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--project" || arg === "-p") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--project requires a directory path");
        process.exit(1);
      }
      projectDir = val;
      i += 1;
      continue;
    }
    if (arg === "--out" || arg === "-o") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--out requires an output path");
        process.exit(1);
      }
      outputFile = val;
      i += 1;
      continue;
    }
    if (arg === "--framework" || arg === "-f") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--framework requires an adapter name");
        process.exit(1);
      }
      framework = val;
      i += 1;
      continue;
    }
    if (arg === "--target" || arg === "-t") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--target requires a compilation target (e.g. bun-linux-x64)");
        process.exit(1);
      }
      extraArgs.push(`--target=${val}`);
      i += 1;
      continue;
    }
    if (arg === "--list-adapters") {
      const adapters = listAdapters();
      console.log(`Available adapters: ${adapters.join(", ") || "(none)"}`);
      process.exit(0);
    }
    extraArgs.push(arg);
  }

  return { projectDir: resolve(projectDir), outputFile, framework, extraArgs };
}

function main(): void {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    const result = compileApp({
      projectDir: parsed.projectDir,
      outputFile: parsed.outputFile,
      framework: parsed.framework,
      extraArgs: parsed.extraArgs,
    });
    logInfo(`binary ready at ${result.outputFile} (${result.framework})`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown compiler failure";
    logError(message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env bun

/**
 * CLI entrypoint for compiling framework app output into a Bun binary.
 */

import { resolve } from "node:path";

import { listAdapters } from "./adapter/registry.js";
import { createDefaultBackendRegistry } from "./backend/registry.js";
import { compileApp } from "./core/compile-app.js";
import { logError, logInfo } from "./utils/log.js";

function printHelp(): void {
  console.log(`
kiln - Compile framework apps into single native Bun executables

Usage:
  kiln [options] [-- bun-build-flags...]

Options:
	-p, --project <dir>      Project root directory (default: ".")
	-o, --out <path>         Output binary path (default: "./server")
	-f, --framework <name>   Framework adapter to use (auto-detected if omitted)
	-b, --backend <name>     Compiler backend to use (default: "bun")
	-e, --engine <engine>    Runtime HTTP server engine: "default" | "bun-serve" (default: "default")
	-t, --target <target>    Cross-compilation target (e.g. bun-linux-x64, bun-windows-x64)
	--list-adapters          List all registered framework adapters
	--list-backends          List all registered compiler backends
	-h, --help               Show this help message

Examples:
  kiln
  kiln -o ./bin/app
  kiln --engine bun-serve -o ./bin/app
  kiln -o ./server-linux --target bun-linux-x64
  kiln -p ./apps/web -f next
`);
}

export interface CliOptions {
  projectDir: string;
  outputFile?: string;
  framework?: string;
  backend?: string;
  target?: string;
  engine?: "default" | "bun-serve";
  extraArgs: string[];
}

export function parseArgs(argv: string[]): CliOptions {
  let projectDir = ".";
  let outputFile: string | undefined;
  let framework: string | undefined;
  let backend: string | undefined;
  let target: string | undefined;
  const configuredEngine = process.env.KILN_ENGINE;
  let engine: "default" | "bun-serve" = "default";
  if (configuredEngine === "default" || configuredEngine === "bun-serve") {
    engine = configuredEngine;
  } else if (configuredEngine) {
    logError('--engine must be either "default" or "bun-serve"');
    process.exit(1);
  }
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
    if (arg === "--backend" || arg === "-b") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--backend requires a compiler backend name");
        process.exit(1);
      }
      backend = val;
      i += 1;
      continue;
    }
    if (arg === "--engine" || arg === "-e") {
      const val = argv[i + 1];
      if (val !== "default" && val !== "bun-serve") {
        logError('--engine must be either "default" or "bun-serve"');
        process.exit(1);
      }
      engine = val;
      i += 1;
      continue;
    }
    if (arg === "--target" || arg === "-t") {
      const val = argv[i + 1];
      if (!val || val.startsWith("-")) {
        logError("--target requires a compilation target (e.g. bun-linux-x64)");
        process.exit(1);
      }
      target = val;
      i += 1;
      continue;
    }
    if (arg === "--list-adapters") {
      const adapters = listAdapters();
      console.log(`Available adapters: ${adapters.join(", ") || "(none)"}`);
      process.exit(0);
    }
    if (arg === "--list-backends") {
      const backends = createDefaultBackendRegistry().list();
      console.log(`Available backends: ${backends.join(", ") || "(none)"}`);
      process.exit(0);
    }
    if (arg === "--") {
      extraArgs.push(...argv.slice(i + 1));
      break;
    }
    extraArgs.push(arg);
  }

  return {
    projectDir: resolve(projectDir),
    outputFile,
    framework,
    backend,
    target,
    engine,
    extraArgs,
  };
}

export function main(): void {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    const result = compileApp({
      projectDir: parsed.projectDir,
      outputFile: parsed.outputFile,
      framework: parsed.framework,
      backend: parsed.backend,
      target: parsed.target,
      engine: parsed.engine,
      extraArgs: parsed.extraArgs,
    });
    logInfo(
      `binary ready at ${result.outputFile} (${result.framework}, ${result.backend} backend)`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown compiler failure";
    logError(message);
    process.exit(1);
  }
}

if (import.meta.main) main();
